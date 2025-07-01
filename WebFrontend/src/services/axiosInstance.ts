// src/services/axiosInstance.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// 백엔드 서버의 기본 URL을 설정합니다.
const API_BASE_URL = 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // HttpOnly 쿠키를 주고받기 위해 반드시 필요합니다.
  withCredentials: true, 
});

// 1. 요청 인터셉터 (Request Interceptor)
//    - 모든 API 요청이 서버로 전송되기 전에 실행됩니다.
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // localStorage에서 accessToken을 가져옵니다.
    const accessToken = localStorage.getItem('accessToken');

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


// 2. 응답 인터셉터 (Response Interceptor)
//    - 서버로부터 응답을 받은 후, .then()이나 .catch()로 처리되기 전에 실행됩니다.
axiosInstance.interceptors.response.use(
  // 응답이 성공적인 경우(2xx 상태 코드) 그대로 반환합니다.
  (response) => response,

  // 응답이 에러인 경우 처리합니다.
  async (error: AxiosError) => {
    // 원본 요청 정보를 가져옵니다.
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 에러이고, 재시도한 요청이 아닌 경우에만 토큰 갱신 로직을 실행합니다.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그를 설정하여 무한 루프를 방지합니다.

      try {
        // 백엔드의 /auth/refresh 엔드포인트로 새 accessToken을 요청합니다.
        const response = await axiosInstance.post('/auth/refresh');
        
        const { accessToken } = response.data;

        // 새로 받은 accessToken을 localStorage에 저장합니다.
        localStorage.setItem('accessToken', accessToken);

        // axios 인스턴스의 기본 헤더를 새로운 토큰으로 업데이트합니다.
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // 실패했던 원래 요청의 헤더도 새로운 토큰으로 업데이트합니다.
        if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // 실패했던 원래 요청을 새로운 토큰으로 다시 시도합니다.
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // 리프레시 토큰마저 만료되었거나, 갱신에 실패한 경우
        console.error('토큰 갱신 실패:', refreshError);
        localStorage.removeItem('accessToken');
        window.location.href = '/login'; // 로그인 페이지로 이동
        return Promise.reject(refreshError);
      }
    }

    // 401 에러가 아니거나, 재시도 요청인 경우 에러를 그대로 반환합니다.
    return Promise.reject(error);
  }
);

export default axiosInstance;
