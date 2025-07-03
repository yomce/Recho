// src/stores/authStore.ts

import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../services/axiosInstance'; // 설정된 Axios 인스턴스
import axios from 'axios';

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
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  setToken: (token: string) => {
    // 1. 받은 토큰을 localStorage에 저장합니다.
    localStorage.setItem('accessToken', token);

    // 2. axios 인스턴스의 기본 헤더에 토큰을 설정하여,
    //    이후의 모든 API 요청에 인증 정보가 포함되도록 합니다.
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 3. 기존의 setUserFromToken 함수를 호출하여 상태를 업데이트합니다.
    //    이렇게 하면 로그인 방식(일반/소셜)에 상관없이 상태 관리 로직이 일관성을 유지합니다.
    get().setUserFromToken();
  },
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
    try {
      // 1. axios.post로 API를 호출합니다.
      const response = await axiosInstance.post('auth/login', { id, password });

      // 2. 성공 시 response.data에서 바로 accessToken을 가져옵니다.
      // .json()을 호출할 필요가 전혀 없습니다.
      const { accessToken } = response.data;

      if (!accessToken) {
        // accessToken이 없는 경우를 대비한 방어 코드
        throw new Error('토큰 정보가 없습니다.');
      }

      // 3. 토큰 저장 및 상태 업데이트 로직을 실행합니다.
      localStorage.setItem('accessToken', accessToken);
      get().setUserFromToken();

    } catch (error) {
      console.error('로그인 실패:', error); // 디버깅을 위해 에러를 로그에 남깁니다.

      // 4. 컴포넌트에서 에러를 인지할 수 있도록 다시 throw 해줍니다.
      if (axios.isAxiosError(error) && error.response) {
        // 서버가 보낸 에러 메시지를 사용합니다.
        throw new Error(error.response.data.message || '로그인에 실패했습니다.');
      }
      // 그 외의 경우 일반적인 에러 메시지를 던집니다.
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  },

  logout: async () => {
    try {
      // 서버에 로그아웃 요청을 보냅니다. (선택적)
      await axiosInstance.post('auth/logout');
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

const initialToken = localStorage.getItem('accessToken');
if (initialToken) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}