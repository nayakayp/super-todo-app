import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useUIStore.setState({
      filter: 'all',
      searchQuery: '',
      theme: 'system',
    });
  });

  describe('filter', () => {
    it('has default filter of "all"', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.filter).toBe('all');
    });

    it('sets filter to "active"', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setFilter('active');
      });

      expect(result.current.filter).toBe('active');
    });

    it('sets filter to "completed"', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setFilter('completed');
      });

      expect(result.current.filter).toBe('completed');
    });
  });

  describe('searchQuery', () => {
    it('has default empty search query', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.searchQuery).toBe('');
    });

    it('sets search query', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSearchQuery('buy groceries');
      });

      expect(result.current.searchQuery).toBe('buy groceries');
    });

    it('clears search query', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSearchQuery('test');
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('theme', () => {
    it('has default theme of "system"', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.theme).toBe('system');
    });

    it('sets theme to "dark"', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('sets theme to "light"', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });
});
