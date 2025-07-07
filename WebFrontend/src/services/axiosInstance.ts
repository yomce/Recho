// src/services/axiosInstance.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

// 백엔드 서버의 기본 URL을 환경 변수에서 가져옵니다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // HttpOnly 쿠키를 주고받기 위해 반드시 필요합니다.
  withCredentials: true,
});

// 1. 요청 인터셉터 (Request Interceptor)
//    - 모든 API 요청이 서버로 전송되기 전에 실행됩니다.
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Zustand 스토어에서 accessToken을 가져옵니다.
    const accessToken = useAuthStore.getState().accessToken;

    // accessToken이 존재하면, 요청 헤더에 'Authorization' 헤더를 추가합니다.
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    // 요청 단계에서 에러가 발생했을 때 처리합니다.
    return Promise.reject(error);
  }
);

// --- 토큰 갱신 로직 (경쟁 상태 방지) ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
// -----------------------------------------

// 2. 응답 인터셉터 (Response Interceptor)
//    - 서버로부터 응답을 받은 후, .then()이나 .catch()로 처리되기 전에 실행됩니다.
axiosInstance.interceptors.response.use(
  // 응답이 성공적인 경우(2xx 상태 코드) 그대로 반환합니다.
  (response) => response,

  // 응답이 에러인 경우 처리합니다.
  async (error: AxiosError) => {
    // 원본 요청 정보를 가져옵니다.
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 에러이고, 재시도한 요청이 아닌 경우에만 토큰 갱신 로직을 실행합니다.
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = "Bearer " + token;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 백엔드의 /auth/refresh 엔드포인트로 새 accessToken을 요청합니다.
        const { data } = await axiosInstance.post("/auth/refresh");

        const { accessToken } = data;

        // 새로 받은 accessToken을 Zustand 스토어에 저장합니다.
        useAuthStore.getState().setAccessToken(accessToken);

        // 실패했던 원래 요청의 헤더도 새로운 토큰으로 업데이트합니다.
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰마저 만료되었거나, 갱신에 실패한 경우
        console.error("토큰 갱신 실패:", refreshError);
        // Zustand 스토어를 통해 안전하게 로그아웃
        useAuthStore.getState().logout();
        processQueue(refreshError as Error, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 401 에러가 아니거나, 재시도 요청인 경우 에러를 그대로 반환합니다.
    return Promise.reject(error);
  }
);

export default axiosInstance;
