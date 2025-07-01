// src/stores/authStore.ts

import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../services/axiosInstance'; // 설정된 Axios 인스턴스

/**
 * JWT 토큰 payload에 포함된 사용자 정보 타입
 */
interface User {
  userId: number;
  username: string;
}

/**
 * 로그인 시 필요한 자격 증명 타입
 */
interface LoginCredentials {
  id: string;
  password: string;
}

/**
 * 스토어의 상태 및 함수들의 타입
 */
interface AuthState {
  user: User | null;
  /**
   * 로컬 스토리지의 토큰을 확인하여 유저 상태를 설정합니다.
   * 앱이 처음 로드될 때 호출됩니다.
   */
  setUserFromToken: () => void;
  /**
   * ID와 비밀번호로 로그인을 시도합니다.
   * 성공 시 토큰을 저장하고 유저 상태를 업데이트합니다.
   * @param credentials - 로그인에 필요한 id와 password
   */
  login: (credentials: LoginCredentials) => Promise<void>;
  /**
   * 서버에 로그아웃 요청을 보내고, 로컬의 토큰과 유저 상태를 초기화합니다.
   */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태: 로그아웃 상태
  user: null,

  setUserFromToken: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedUser = jwtDecode<User>(token);
        set({ user: decodedUser });
      } catch (error) {
        console.error("유효하지 않은 토큰입니다. 토큰을 삭제합니다.", error);
        localStorage.removeItem('accessToken');
        set({ user: null });
      }
    }
  },

  login: async ({ id, password }) => {
    // API 호출 로직: 에러는 호출한 컴포넌트에서 처리하도록 던져줍니다.
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '로그인에 실패했습니다.');
    }

    const data = await response.json();
    const { accessToken } = data;

    // 1. 토큰을 로컬 스토리지에 저장합니다.
    localStorage.setItem('accessToken', accessToken);

    // 2. 저장된 토큰을 기반으로 전역 상태를 업데이트합니다.
    get().setUserFromToken();
  },

  logout: async () => {
    try {
      // 서버에 로그아웃 요청을 보냅니다. (선택적)
      await axiosInstance.post('http://localhost:3000/auth/logout');
    } catch (error) {
      console.error('로그아웃 API 호출에 실패했지만, 클라이언트에서는 로그아웃을 진행합니다.', error);
    } finally {
      // 클라이언트의 토큰과 상태를 확실하게 초기화합니다.
      localStorage.removeItem('accessToken');
      set({ user: null });
    }
  },
}));

/**
 * 앱이 처음 시작될 때 로컬 스토리지의 토큰을 확인하여
 * 로그인 상태를 복원하는 로직을 실행합니다.
 */
useAuthStore.getState().setUserFromToken();