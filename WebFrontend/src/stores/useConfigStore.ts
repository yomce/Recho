import { create } from 'zustand';
import axiosInstance from '@/services/axiosInstance';

// 백엔드의 PublicConfigDto와 일치하는 타입
interface AppConfig {
  kakaoMapAppKey: string;
}

// 스토어의 상태와 액션을 정의하는 타입
interface ConfigState {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  isLoading: true,
  error: null,
  
  // 백엔드에서 설정값을 가져오는 비동기 액션
  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      // .env 파일에서 백엔드 API 주소를 가져옵니다.
      const apiUrl = import.meta.env.VITE_API_URL;
      
      // 백엔드의 공개 설정 엔드포인트를 호출합니다.
      const response = await axiosInstance.get<AppConfig>(`${apiUrl}/config/public`);
      
      // 성공 시, 받아온 설정값을 상태에 저장합니다.
      set({ config: response.data, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch app configuration:', err);
      set({ error: 'Application configuration could not be loaded.', isLoading: false });
    }
  },
}));