// src/stores/authStore.ts

import { create } from "zustand";
import { jwtDecode, type JwtPayload } from "jwt-decode";
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
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean; // 인증 상태 확인 중인지 여부
  actions: {
    setToken: (token: string | null) => void;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 1. 초기 상태 설정
  user: null,
  accessToken: null,
  isLoading: true, // 앱 시작 시, 로딩 상태로 초기화

  // 2. 상태를 변경하는 함수들
  actions: {
    /**
     * 토큰을 처리하고, 모든 관련 상태를 업데이트하는 중앙화된 함수
     */
    setToken: (token) => {
      // 최종적으로 스토어에 저장될 상태를 미리 정의합니다.
      let finalUserState: { user: User | null; accessToken: string | null } = {
        user: null,
        accessToken: null,
      };

      try {
        if (token) {
          // 토큰이 유효한 경우, 디코딩하여 상태를 준비합니다.
          const decodedUser = jwtDecode<User>(token);
          finalUserState = { user: decodedUser, accessToken: token };
          
          // Side effects (localStorage, axios header)
          localStorage.setItem("accessToken", token);
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // React Native WebView로 토큰 전송 로직 추가
          if (window.ReactNativeWebView) {
            const message = JSON.stringify({ type: "TOKEN_UPDATE", token });
            window.ReactNativeWebView.postMessage(message);
          }
        } else {
          // 토큰이 null인 경우, 모든 인증 정보를 제거합니다.
          localStorage.removeItem("accessToken");
          delete axiosInstance.defaults.headers.common["Authorization"];
        }
      } catch (error) {
        // 토큰이 유효하지 않거나 디코딩에 실패한 경우
        console.error("유효하지 않은 토큰입니다. 상태를 초기화합니다.", error);
        localStorage.removeItem("accessToken");
        delete axiosInstance.defaults.headers.common["Authorization"];
      } finally {
        // 성공하든, 실패하든, 어떤 경우에도 마지막에 단 한 번만 상태를 업데이트합니다.
        set({ ...finalUserState, isLoading: false });
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
        get().actions.setToken(null);
      }
    },
  },
}));

/**
 * 앱이 처음 시작될 때 localStorage의 토큰을 확인하여
 * 로그인 상태를 복원하는 로직을 실행합니다.
 */
useAuthStore.getState().actions.setToken(localStorage.getItem("accessToken"));
