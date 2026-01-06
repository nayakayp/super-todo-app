import { create } from 'zustand';

export type Filter = 'all' | 'active' | 'completed';

type UIState = {
  filter: Filter;
  searchQuery: string;
  setFilter: (filter: Filter) => void;
  setSearchQuery: (query: string) => void;
};

export const useUIStore = create<UIState>()((set) => ({
  filter: 'all',
  searchQuery: '',
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
