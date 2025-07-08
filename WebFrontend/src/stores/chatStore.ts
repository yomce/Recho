// src/stores/chatStore.ts
import { create } from 'zustand';
import axiosInstance from '../services/axiosInstance'; // axios 인스턴스 경로
import { socket } from '../services/socket';           // socket 인스턴스 경로
import { useAuthStore } from './authStore';           // 인증 스토어 경로

// --- 타입 정의 ---
export interface Message {
  id: string;
  roomId: string;
  senderId?: string; // 시스템 메시지는 senderId가 없을 수 있음
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    profileUrl: string | null;
  };
  isSystem?: boolean; // 시스템 메시지 여부를 나타내는 플래그
}

// 채팅 상대방 정보 타입
interface ChatPartner {
  id: string | null;
  username: string;
  profileUrl: string | null;
}

// 스토어의 상태와 액션을 정의하는 타입
interface ChatState {
  // --- 상태 (State) ---
  isConnected: boolean; // ⬅️ 소켓 연결 상태 추가
  roomId: string | null;
  messages: Message[];
  chatPartner: ChatPartner;
  isModalOpen: boolean;
  modalType: 'invite' | 'leave' | null;
  

  // --- 액션 (Actions) ---
  initializeRoom: (roomId: string) => Promise<void>;
  sendMessage: (content: string) => void;
  inviteUser: (inviteeId: string) => void;
  leaveCurrentRoom: () => void;
  openModal: (type: 'invite' | 'leave') => void;
  closeModal: () => void;
  cleanupRoom: () => void;
  initializeSocketListeners: () => void;
  disconnectSocket: () => void; // ⬅️ 추가

}

let isSocketInitialized = false;

export const useChatStore = create<ChatState>((set, get) => ({
  // --- 초기 상태 값 (변경 없음) ---
  isConnected: false,
  roomId: null,
  messages: [],
  chatPartner: { id: null, username: '대화 상대 로딩...', profileUrl: null },
  isModalOpen: false,
  modalType: null,
  /**
   * 소켓 이벤트 리스너를 초기화하는 액션 (앱 실행 시 한 번만 호출)
   */
   initializeSocketListeners: () => {
    // 이미 초기화되었다면 절대 다시 실행하지 않음
    if (isSocketInitialized) {
      return;
    }

    // --- 모든 이벤트 리스너를 최상위 레벨에서 한 번만 등록 ---

    socket.on('connect', () => {
      console.log('✅ 소켓 연결 성공!');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('❌ 소켓 연결이 끊어졌습니다.');
      set({ isConnected: false });
    });

    socket.on('newMessage', (message: Message) => {
      if (get().roomId === message.roomId) {
        set((state) => ({ messages: [...state.messages, message] }));
      }
    });

    socket.on('userLeft', (data: { username: string; roomId: string }) => {
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

    socket.on('userInvited', (data: { username: string; roomId: string }) => {
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

    // --- 리스너 등록 후 연결 시도 ---
    socket.connect();
    
    // 초기화 완료 플래그를 true로 설정하여 다시는 이 함수가 실행되지 않도록 함
    isSocketInitialized = true;
  },
  
  disconnectSocket: () => {
    if (socket?.connected) {
      socket.disconnect();
    }
    // isSocketInitialized는 false로 바꾸지 않습니다. 리스너는 계속 유지되어야 합니다.
  },

  // ... (initializeRoom, sendMessage 등 다른 액션들은 변경 없음) ...
  initializeRoom: async (roomId) => {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    set({
      roomId,
      messages: [],
      chatPartner: { id: null, username: '로딩 중...', profileUrl: null },
    });
    try {
      const response = await axiosInstance.get(`/chat/rooms/${roomId}/history`);
      const messageHistory: Message[] = response.data;
      set({ messages: messageHistory });
      const partner = messageHistory.find(
        (msg) => msg.senderId && msg.senderId !== currentUser.id
      )?.sender;
      if (partner) {
        set({
          chatPartner: {
            id: partner.id,
            username: partner.username,
            profileUrl: partner.profileUrl,
          },
        });
      } else {
        set({
          chatPartner: { id: null, username: '새로운 대화', profileUrl: null },
        });
      }
    } catch (error) {
      console.error('메시지 기록 로딩 실패:', error);
      set({
        chatPartner: { id: null, username: '정보 없음', profileUrl: null },
      });
    }
    socket.emit('joinRoom', { id: currentUser.id, roomId });
  },
  sendMessage: (content) => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!content.trim() || !roomId || !user) return;
    socket.emit('sendMessage', {
      roomId,
      senderId: user.id,
      senderName: user.username,
      content,
    });
  },
  inviteUser: (inviteeId) => {
    const { roomId } = get();
    if (!inviteeId.trim() || !roomId) return;
    socket.emit('inviteUser', { roomId, inviteeId });
    get().closeModal();
  },
  leaveCurrentRoom: () => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!roomId || !user) return;
    socket.emit('leaveRoom', { id: user.id, roomId });
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