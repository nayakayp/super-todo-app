import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Filter = 'all' | 'active' | 'completed';
export type Theme = 'light' | 'dark' | 'system';

type UIState = {
  filter: Filter;
  searchQuery: string;
  theme: Theme;
  setFilter: (filter: Filter) => void;
  setSearchQuery: (query: string) => void;
  setTheme: (theme: Theme) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      filter: 'all',
      searchQuery: '',
      theme: 'system',
      setFilter: (filter) => set({ filter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
