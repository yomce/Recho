import axios, { type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: 나중에 .env 파일로 관리
const API_BASE_URL = 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// 모든 요청에 대해 AsyncStorage에서 토큰을 가져와 헤더에 추가
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => {
    // 요청 에러 처리
    console.error('API Request Error:', error);
    return Promise.reject(error);
  },
);

// 응답은 별다른 처리 없이 그대로 반환
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // 응답 에러 처리
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export default axiosInstance;
