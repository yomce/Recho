import { create } from 'zustand';
import axiosInstance from '../services/axiosInstance';
import { socket } from '../services/socket';
import { useAuthStore } from './authStore';
import { type Socket } from 'socket.io-client';

// --- 타입 정의 ---
export interface Message {
  id: string;
  roomId: string;
  senderId?: string;
  content: string;
  createdAt: string;
  sender?: {
    id:string;
    username: string;
    profileImageUrl: string | null;
  };
  isSystem?: boolean;
}

interface MyRoom { id: string; }

interface ChatPartner {
  id: string | null;
  username: string;
  profileImageUrl: string | null;
}

interface ChatState {
  socket: Socket;
  isConnected: boolean;
  roomId: string | null;
  messages: Message[];
  chatPartner: ChatPartner;
  isModalOpen: boolean;
  modalType: 'invite' | 'leave' | null;
  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalUnreadCount: number;
  initializeRoom: (roomId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => void;
  inviteUser: (inviteeId: string) => void;
  leaveCurrentRoom: () => void;
  openModal: (type: 'invite' | 'leave') => void;
  closeModal: () => void;
  cleanupRoom: () => void;
  initializeSocketListeners: () => void;
  disconnectSocket: () => void;
  fetchTotalUnreadCount: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: socket,
  isConnected: false,
  roomId: null,
  messages: [],
  chatPartner: { id: null, username: '대화 상대 로딩...', profileImageUrl: null },
  isModalOpen: false,
  modalType: null,
  page: 1,
  hasMore: true,
  isLoadingMore: false,
  totalUnreadCount: 0,
  
  fetchTotalUnreadCount: async () => {
    try {
      const response = await axiosInstance.get<{ unreadCount: number }>('chat/unread-count');
      set({ totalUnreadCount: response.data.unreadCount });
    } catch (error) {
      console.error("Failed to fetch total unread count", error);
      set({ totalUnreadCount: 0 });
    }
  },

  initializeSocketListeners: () => {
    // 이미 리스너가 설정되었으면 중복 실행 방지
    const currentSocket = get().socket;
    if (currentSocket.listeners('connect').length > 0) {
      console.log('Socket listeners already initialized.');
      // 만약 연결이 끊겼을 수 있으니 재연결 시도
      if (!currentSocket.connected) {
        currentSocket.connect();
      }
      return;
    }

    console.log('Initializing socket listeners...');

    currentSocket.on('connect', () => {
      console.log('✅ 소켓 연결 성공!');
      set({ isConnected: true });

      // ✨ 중요: 연결 성공 후, 내가 속한 모든 방에 다시 조인합니다.
      // 이렇게 하면 페이지 이동 시에도 항상 방에 참여한 상태가 유지됩니다.
      const { user } = useAuthStore.getState();
      if (user) {
        // App.tsx에서 이관된 로직
        axiosInstance.get<MyRoom[]>('chat/my-rooms')
          .then(response => {
            const myRooms = response.data;
            if (myRooms && myRooms.length > 0) {
              console.log('Re-joining all my rooms:', myRooms.map(r => r.id));
              myRooms.forEach(room => {
                currentSocket.emit('joinRoom', { id: user.id, roomId: room.id });
              });
            }
          })
          .catch(error => {
            console.error("Failed to fetch and join my rooms on connect", error);
          });
      }
    });
    currentSocket.on('disconnect', () => {
      console.log('❌ 소켓 연결이 끊어졌습니다.');
      set({ isConnected: false });
    });
    currentSocket.on('newMessage', (message: Message) => {
      if (get().roomId === message.roomId) {
        set((state) => ({ messages: [...state.messages, message] }));
      }
    });
    currentSocket.on('unreadCountUpdated', () => {
      console.log('🔄 안 읽은 메시지 수 업데이트 신호 수신!');
      get().fetchTotalUnreadCount();
    });
    currentSocket.on('userLeft', (data: { username: string; roomId: string }) => {
      if (get().roomId === data.roomId) {
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          roomId: data.roomId,
          content: `${data.username}님이 나가셨습니다.`,
          createdAt: new Date().toISOString(),
          isSystem: true,
        };
        set((state) => ({ messages: [...state.messages, systemMessage] }));
      }
    });
    currentSocket.on('userInvited', (data: { username: string; roomId: string }) => {
      if (get().roomId === data.roomId) {
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          roomId: data.roomId,
          content: `${data.username}님이 초대되었습니다.`,
          createdAt: new Date().toISOString(),
          isSystem: true,
        };
        set((state) => ({ messages: [...state.messages, systemMessage] }));
      }
    });
    currentSocket.connect();
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
  },

  initializeRoom: async (roomId) => {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;

    // ✨ 중요: 여기서 joinRoom 이벤트를 보내지 않습니다.
    // 소켓이 연결될 때 App.tsx나 리스너에서 모든 방에 미리 join하기 때문입니다.
    // get().socket.emit('joinRoom', { id: currentUser.id, roomId });

    set({
      roomId,
      messages: [],
      chatPartner: { id: null, username: '로딩 중...', profileImageUrl: null },
      page: 1,
      hasMore: true,
      isLoadingMore: false,
    });

    try {
      // 이제 이 API는 사용자가 방에 참여한 것이 보장된 상태에서 호출됩니다.
      const response = await axiosInstance.get(`chat/rooms/${roomId}/history?page=1&limit=20`);
      console.log('history data', response.data);

      const messageHistory: Message[] = response.data.reverse();
      set({ 
        messages: messageHistory,
        page: 2,
        hasMore: response.data.length === 20, 
      });
      const partner = messageHistory.find(
        (msg) => msg.senderId && msg.senderId !== currentUser.id
      )?.sender;
      if (partner) {
        set({
          chatPartner: { id: partner.id, username: partner.username, profileImageUrl: partner.profileImageUrl },
        });
      } else {
        const roomDetailsResponse = await axiosInstance.get(`chat/rooms/${roomId}`);
        const otherUser = roomDetailsResponse.data.userRooms.find(ur => ur.user.id !== currentUser.id)?.user;
        set({
          chatPartner: otherUser 
            ? { id: otherUser.id, username: otherUser.username, profileImageUrl: otherUser.profileImageUrl }
            : { id: null, username: '새로운 대화', profileImageUrl: null },
        });
      }
    } catch (error) {
      console.error('메시지 기록 로딩 실패:', error);
      set({ chatPartner: { id: null, username: '정보 없음', profileImageUrl: null }});
    }
    get().socket.emit('joinRoom', { id: currentUser.id, roomId });
  },

  sendMessage: (content) => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!content.trim() || !roomId || !user) return;
    get().socket.emit('sendMessage', {
      roomId,
      senderId: user.id,
      content,
    });
  },
  
  inviteUser: (inviteeId) => {
    const { roomId } = get();
    if (!inviteeId.trim() || !roomId) return;
    get().socket.emit('inviteUser', { roomId, inviteeId });
    get().closeModal();
  },

  loadMoreMessages: async () => {
    const { roomId, page, hasMore, isLoadingMore, messages } = get();
    if (!roomId || !hasMore || isLoadingMore) return;
    set({ isLoadingMore: true });
    try {
      const response = await axiosInstance.get(`chat/rooms/${roomId}/history?page=${page}&limit=20`);
      const olderMessages: Message[] = response.data.reverse();
      set({
        messages: [...olderMessages, ...messages],
        page: page + 1,
        hasMore: olderMessages.length === 20,
      });
    } catch (error) {
      console.error('이전 메시지 로딩 실패:', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },
  
  leaveCurrentRoom: () => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!roomId || !user) return;
    get().socket.emit('leaveRoom', { id: user.id, roomId });
    get().cleanupRoom();
    get().closeModal();
  },

  openModal: (type) => set({ isModalOpen: true, modalType: type }),
  closeModal: () => set({ isModalOpen: false, modalType: null }),
  cleanupRoom: () => {
    set({
      roomId: null,
      messages: [],
      chatPartner: { id: null, username: '', profileImageUrl: null },
    });
  },
}));