import { create } from 'zustand';

interface SizeState {
  width: number;
  height: number;
  setSize: (size: { width: number; height: number }) => void;
}

export const useSizeStore = create<SizeState>((set) => ({
  width: 0,
  height: 0,
  setSize: (newSize) => set({ width: newSize.width, height: newSize.height }),
}));