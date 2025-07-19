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
    profileUrl: string | null;
  };
  isSystem?: boolean;
}

interface MyRoom { id: string; }

interface ChatPartner {
  id: string | null;
  username: string;
  profileUrl: string | null;
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

let isSocketInitialized = false;

export const useChatStore = create<ChatState>((set, get) => ({
  socket: socket,
  isConnected: false,
  roomId: null,
  messages: [],
  chatPartner: { id: null, username: '대화 상대 로딩...', profileUrl: null },
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
    if (isSocketInitialized) return;
    const currentSocket = get().socket;
    currentSocket.on('connect', async () => {
      console.log('✅ 소켓 연결 성공!');
      set({ isConnected: true });
      const { user } = useAuthStore.getState();
      if (user) {
        try {
          const response = await axiosInstance.get<MyRoom[]>('chat/my-rooms');
          const myRooms = response.data;
          if (myRooms && myRooms.length > 0) {
            console.log('Joining all my rooms:', myRooms.map(r => r.id));
            myRooms.forEach(room => {
              currentSocket.emit('joinRoom', { id: user.id, roomId: room.id });
            });
          }
        } catch (error) {
          console.error("Failed to fetch and join my rooms on connect", error);
        }
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
    isSocketInitialized = true;
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
  },

  initializeRoom: async (roomId) => {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    set({
      roomId,
      messages: [],
      chatPartner: { id: null, username: '로딩 중...', profileUrl: null },
      page: 1,
      hasMore: true,
      isLoadingMore: false,
    });
    try {
      const response = await axiosInstance.get(`chat/rooms/${roomId}/history?page=1&limit=20`);
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
          chatPartner: { id: partner.id, username: partner.username, profileUrl: partner.profileUrl },
        });
      } else {
        const roomDetailsResponse = await axiosInstance.get(`chat/rooms/${roomId}`);
        const otherUser = roomDetailsResponse.data.userRooms.find(ur => ur.user.id !== currentUser.id)?.user;
        set({
          chatPartner: otherUser 
            ? { id: otherUser.id, username: otherUser.username, profileUrl: otherUser.profileUrl }
            : { id: null, username: '새로운 대화', profileUrl: null },
        });
      }
    } catch (error) {
      console.error('메시지 기록 로딩 실패:', error);
      set({ chatPartner: { id: null, username: '정보 없음', profileUrl: null }});
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
      chatPartner: { id: null, username: '', profileUrl: null },
    });
  },
}));