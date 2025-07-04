// src/stores/chatStore.ts
import { create } from 'zustand';
import axiosInstance from '../services/axiosInstance';
import { socket } from '../services/socket';
import { useAuthStore } from './authStore';

// --- 타입 정의 ---
export interface Message {
  id: string;
  roomId: string;
  senderId?: number;
  senderName?: string;
  content: string;
  createdAt: string;
  sender?: { 
    id: number;
    username: string; 
    profileUrl: string | null;
  };
  isSystem?: boolean;
}

interface ChatPartner {
  id: number | null;
  username: string;
  profileUrl: string | null;
}

interface ChatState {
  roomId: string | null;
  messages: Message[];
  chatPartner: ChatPartner;
  isModalOpen: boolean;
  modalType: 'invite' | 'leave' | null;

  // Actions
  initializeRoom: (roomId: string) => Promise<void>;
  sendMessage: (content: string) => void;
  inviteUser: (inviteeId: string) => void;
  leaveCurrentRoom: () => void;
  openModal: (type: 'invite' | 'leave') => void;
  closeModal: () => void;
  cleanupRoom: () => void;
  // 소켓 리스너 초기화를 위한 액션
  initializeSocketListeners: () => void;
}

// 스토어 외부에서 리스너 초기화 여부를 추적하는 플래그
let areListenersInitialized = false;

export const useChatStore = create<ChatState>((set, get) => ({
  // --- 초기 상태 ---
  roomId: null,
  messages: [],
  chatPartner: { id: null, username: '대화 상대 로딩...', profileUrl: null },
  isModalOpen: false,
  modalType: null,

  // --- 소켓 리스너 초기화 액션 ---
  initializeSocketListeners: () => {
    // 리스너가 이미 초기화되었다면, 중복 등록을 방지하기 위해 아무것도 하지 않음
    if (areListenersInitialized || !socket) return;

    socket.on('newMessage', (message: Message) => {
      // 현재 보고 있는 채팅방의 메시지만 상태에 추가
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

    areListenersInitialized = true;
  },

  // --- 기존 액션들 ---
  initializeRoom: async (roomId) => {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;

    set({ roomId, messages: [], chatPartner: { id: null, username: '로딩 중...', profileUrl: null } });

    try {
      const response = await axiosInstance.get(`/chat/rooms/${roomId}/history`);
      const messageHistory: Message[] = response.data;
      set({ messages: messageHistory });
      
      const partnerSender = messageHistory.find(
        (msg) => msg.senderId && msg.senderId !== currentUser.userId
      )?.sender;

      if (partnerSender) {
        set({ 
          chatPartner: {
            id: partnerSender.id,
            username: partnerSender.username,
            profileUrl: partnerSender.profileUrl,
          }
        });
      } else {
        set({ chatPartner: { id: null, username: '새로운 채팅방', profileUrl: null } });
      }
      
    } catch (error) {
      console.error('메시지 기록 로딩 실패:', error);
      set({ chatPartner: { id: null, username: '정보 없음', profileUrl: null } });
    }

    if (!socket.connected) socket.connect();
    socket.emit('joinRoom', { userId: currentUser.userId, roomId });
  },

  sendMessage: (content) => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!content.trim() || !roomId || !user) return;

    socket.emit('sendMessage', {
      roomId,
      senderId: user.userId,
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
    socket.emit('leaveRoom', { userId: user.userId, roomId });
    set({ roomId: null, messages: [], chatPartner: { id: null, username: '', profileUrl: null } });
    get().closeModal();
  },

  openModal: (type) => set({ isModalOpen: true, modalType: type }),
  closeModal: () => set({ isModalOpen: false, modalType: null }),
  
  cleanupRoom: () => {
    // 이제 이 함수는 상태만 초기화하고, 리스너는 제거하지 않습니다.
    set({ roomId: null, messages: [], chatPartner: { id: null, username: '', profileUrl: null } });
  },
}));

// 소켓 연결 및 리스너 초기화를 스토어 생성 후 한 번만 실행
const { initializeSocketListeners } = useChatStore.getState();
initializeSocketListeners();