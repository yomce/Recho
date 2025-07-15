//src/stores/recentSearchesStore.ts
import {create} from 'zustand';

const STORAGE_KEY = 'recent_searches';

interface RecentSearchesState {
  searches: string[];
  loadSearches: () => void;
  addSearch: (term: string) => void;
  removeSearch: (term: string) => void;
  clearAll: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesState>((set, get) => ({
  searches: [],

  // 로컬 스토리지에서 검색어 불러오기
  loadSearches: () => {
    const savedSearches = localStorage.getItem(STORAGE_KEY);
    if (savedSearches) {
      set({ searches: JSON.parse(savedSearches) });
    }
  },

  // 검색어 추가 (상태와 로컬 스토리지 동시 업데이트)
  addSearch: (term) => {
    const { searches } = get();
    const newSearches = [term, ...searches.filter(s => s !== term)].slice(0, 10);
    set({ searches: newSearches });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
  },

  // 검색어 삭제
  removeSearch: (term) => {
    const { searches } = get();
    const updatedSearches = searches.filter(s => s !== term);
    set({ searches: updatedSearches });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSearches));
  },

  // 전체 삭제
  clearAll: () => {
    set({ searches: [] });
    localStorage.removeItem(STORAGE_KEY);
  },
}));