import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToastStore } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast('Test message', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('adds toast with default type', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast('Info message');
    });

    expect(result.current.toasts[0].type).toBe('info');
  });

  it('removes a toast manually', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast('Test message', 'error', 0); // 0 = no auto-remove
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-removes toast after duration', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast('Auto-remove', 'warning', 1000);
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('supports multiple toasts', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast('Toast 1', 'success', 0);
      result.current.addToast('Toast 2', 'error', 0);
      result.current.addToast('Toast 3', 'info', 0);
    });

    expect(result.current.toasts).toHaveLength(3);
  });
});
