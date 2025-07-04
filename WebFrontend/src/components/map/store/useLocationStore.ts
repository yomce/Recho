// -- LocationSearch에서 선택한 위치 정보를 전역 상태로 저장하는 Zustand 스토어입니다 -- 
//    게시글 작성 등 다른 컴포넌트에서 해당 위치 정보에 접근할 수 있도록 전역으로 관리합니다.

import { create } from 'zustand';

export interface Location {
  place_name: string;
  address: string;
  road_address_name: string;
  x: string;    // longitude
  y: string;    // latitude
  region_level1: string;
  region_level2: string;
  region_level3: string;
}

interface LocationStore {
  location: Location | null;
  setLocation: (loc: Location) => void;
  resetLocation: () => void;
}

// 위치 정보 전역 상태 관리 훅
export const useLocationStore = create<LocationStore>((set) => ({
  location: null,
  setLocation: (loc) => set({ location: loc }),
  resetLocation: () => set({ location: null }),
}));
