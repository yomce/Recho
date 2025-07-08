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
}

// 리스너 중복 등록을 방지하기 위한 플래그
let areListenersInitialized = false;

export const useChatStore = create<ChatState>((set, get) => ({
  // --- 초기 상태 값 ---
  roomId: null,
  messages: [],
  chatPartner: { id: null, username: '대화 상대 로딩...', profileUrl: null },
  isModalOpen: false,
  modalType: null,

  /**
   * 소켓 이벤트 리스너를 초기화하는 액션 (앱 실행 시 한 번만 호출)
   */
  initializeSocketListeners: () => {
  // 리스너가 이미 등록되었다면 중복 실행 방지
  if (socket.hasListeners('connect')) {
    console.log('이미 connect 리스너가 등록되어 있습니다.');
    return;
  }

  // 소켓이 서버에 연결되었을 때 모든 이벤트 리스너를 등록
  socket.on('connect', () => {
    console.log('✅ 소켓 연결 성공! 이벤트 리스너를 등록합니다.');

    // --- "새 메시지 수신" 리스너 ---
    socket.on('newMessage', (message: Message) => {
      // console.log('⬅️ [Client] Received newMessage:', message);
      if (get().roomId === message.roomId) {
        set((state) => ({ messages: [...state.messages, message] }));
      }
    });

    // --- "다른 유저 퇴장" 리스너 ---
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

    // --- ❗️ 지적해주신 "유저 초대 성공" 리스너 ---
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

  });
  
  // 소켓 연결 시작
  socket.connect();
},

  /**
   * 특정 채팅방에 들어갈 때 실행되는 초기화 함수
   */
  initializeRoom: async (roomId) => {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;

    // 방 상태 초기화
    set({
      roomId,
      messages: [],
      chatPartner: { id: null, username: '로딩 중...', profileUrl: null },
    });

    // 1. HTTP 요청으로 이전 메시지 기록 가져오기
    try {
      const response = await axiosInstance.get(`/chat/rooms/${roomId}/history`);
      const messageHistory: Message[] = response.data;
      set({ messages: messageHistory });

      // 메시지 기록에서 상대방 정보 찾기
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
        // 대화 내역이 없는 경우 (새로운 채팅방)
        // TODO: 별도 API로 상대방 정보를 가져오는 로직이 필요할 수 있음
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

    // 2. 소켓 연결 및 방 입장(join) 이벤트 전송
    if (!socket.connected) socket.connect();
    socket.emit('joinRoom', { id: currentUser.id, roomId });
  },

  /**
   * 메시지 보내기
   */
  sendMessage: (content) => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!content.trim() || !roomId || !user) return;

    socket.emit('sendMessage', {
      roomId,
      senderId: user.id,
      senderName: user.username, // 백엔드에서 필요 시 사용
      content,
    });
  },

  /**
   * 다른 유저 초대
   */
  inviteUser: (inviteeId) => {
    const { roomId } = get();
    if (!inviteeId.trim() || !roomId) return;
    socket.emit('inviteUser', { roomId, inviteeId });
    get().closeModal(); // 초대 후 모달 닫기
  },

  /**
   * 현재 채팅방 나가기
   */
  leaveCurrentRoom: () => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!roomId || !user) return;
    socket.emit('leaveRoom', { id: user.id, roomId });
    get().cleanupRoom(); // 상태 초기화
    get().closeModal();  // 모달 닫기
  },

  /**
   * 모달 열기
   */
  openModal: (type) => set({ isModalOpen: true, modalType: type }),

  /**
   * 모달 닫기
   */
  closeModal: () => set({ isModalOpen: false, modalType: null }),

  /**
   * 채팅방 관련 상태 초기화
   */
  cleanupRoom: () => {
    set({
      roomId: null,
      messages: [],
      chatPartner: { id: null, username: '', profileUrl: null },
    });
  },
}));

// 앱 진입점에서 소켓 리스너를 한 번만 초기화합니다.
// (예: App.tsx 또는 메인 레이아웃 컴포넌트의 useEffect)
// useChatStore.getState().initializeSocketListeners();