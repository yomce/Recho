import axios from 'axios';

const apiClient = axios.create({
  // Vite 프록시 설정을 사용하므로 '/api'를 기본 경로로 설정합니다.
  baseURL: '/api', 
});

export default apiClient;