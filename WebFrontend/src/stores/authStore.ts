// src/stores/authStore.ts

import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../services/axiosInstance"; // 설정된 Axios 인스턴스
import axios from "axios";

/**
 * JWT 토큰 payload에 포함된 사용자 정보 타입
 */
export interface User {
  id: string;
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
 * 스토어의 상태 및 함수들의 타입 정의
 * 상태와 액션을 명확히 분리하여 관리합니다.
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  actions: {
    setToken: (token: string | null) => void;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  actions: {
    /**
     * 토큰을 상태와 localStorage에 설정하고, 관련된 모든 사이드 이펙트를 처리합니다.
     * @param token - 새로운 액세스 토큰 또는 null (로그아웃 시)
     */
    setToken: (token) => {
      if (token) {
        // 1. localStorage에 'accessToken' 키로 토큰 저장
        localStorage.setItem("accessToken", token);

        // 2. Axios 인스턴스의 기본 헤더 설정
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        try {
          // 3. 토큰을 디코딩하여 사용자 정보 추출 및 상태 업데이트
          const decodedUser = jwtDecode<User>(token);
          set({ accessToken: token, user: decodedUser });

          // 4. React Native WebView로 토큰 전송
          if (window.ReactNativeWebView) {
            const message = JSON.stringify({
              type: "TOKEN_UPDATE",
              token,
            });
            window.ReactNativeWebView.postMessage(message);
          }
        } catch (error) {
          console.error(
            "유효하지 않은 토큰입니다. 상태를 초기화합니다.",
            error
          );
          get().actions.setToken(null); // 잘못된 토큰이면 모든 관련 상태 초기화
        }
      } else {
        // 토큰이 null이면 모든 인증 정보 제거
        localStorage.removeItem("accessToken");
        delete axiosInstance.defaults.headers.common["Authorization"];
        set({ accessToken: null, user: null });
      }
    },

    /**
     * 로그인을 처리하고 성공 시 토큰을 설정합니다.
     */
    login: async (credentials) => {
      try {
        const response = await axiosInstance.post("auth/login", credentials);
        const { accessToken } = response.data;
        if (!accessToken) {
          throw new Error("서버로부터 토큰이 제공되지 않았습니다.");
        }
        get().actions.setToken(accessToken);
      } catch (error) {
        console.error("로그인 실패:", error);
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(
            error.response.data.message || "로그인에 실패했습니다."
          );
        }
        throw new Error("알 수 없는 오류로 로그인에 실패했습니다.");
      }
    },

    /**
     * 로그아웃을 처리하고 클라이언트 상태를 초기화합니다.
     */
    logout: async () => {
      try {
        await axiosInstance.post("auth/logout");
      } catch (error) {
        console.error(
          "로그아웃 API 호출에 실패했지만, 클라이언트에서는 로그아웃을 진행합니다.",
          error
        );
      } finally {
        get().actions.setToken(null); // 최종적으로 상태 초기화
      }
    },
  },
}));

/**
 * 앱이 처음 시작될 때 localStorage의 토큰을 확인하여
 * 로그인 상태를 복원하는 로직을 실행합니다.
 */
useAuthStore.getState().actions.setToken(localStorage.getItem("accessToken"));
