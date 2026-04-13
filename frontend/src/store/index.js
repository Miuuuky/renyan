import { create } from 'zustand';

export const useStore = create((set) => ({
  tags: [],
  setTags(tags) { set({ tags }); },
}));
