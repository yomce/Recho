import { create } from 'zustand';

// 스토어의 상태와 액션에 대한 타입 정의
interface VinylState {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  resetCurrentIndex: () => void; // 필요시 인덱스를 초기화하는 액션
}

export const useVinylStore = create<VinylState>((set) => ({
  // 초기 상태 값
  currentIndex: 0,
  // 상태를 변경하는 액션 (함수)
  setCurrentIndex: (index) => set({ currentIndex: index }),
  // 상태를 초기값으로 리셋하는 액션
  resetCurrentIndex: () => set({ currentIndex: 0 }),
}));