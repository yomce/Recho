import { create } from 'zustand';

interface UiState {
  isVinylCreateModalOpen: boolean;
  actions: {
    openVinylCreateModal: () => void;
    closeVinylCreateModal: () => void;
  };
}

export const useUiStore = create<UiState>((set) => ({
  isVinylCreateModalOpen: false,
  actions: {
    openVinylCreateModal: () => set({ isVinylCreateModalOpen: true }),
    closeVinylCreateModal: () => set({ isVinylCreateModalOpen: false }),
  },
}));