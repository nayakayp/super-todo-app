import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useFocusStore, formatTime } from './focusStore';

describe('focusStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useFocusStore.setState({
      isActive: false,
      isPaused: false,
      mode: 'work',
      timeRemaining: 25 * 60,
      completedPomodoros: 0,
      focusedTodoId: null,
      settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
      },
    });
  });

  describe('startTimer', () => {
    it('should start the timer', () => {
      useFocusStore.getState().startTimer();
      const state = useFocusStore.getState();

      expect(state.isActive).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.mode).toBe('work');
      expect(state.timeRemaining).toBe(25 * 60);
    });

    it('should start timer with focused todo', () => {
      useFocusStore.getState().startTimer('todo-123');
      const state = useFocusStore.getState();

      expect(state.isActive).toBe(true);
      expect(state.focusedTodoId).toBe('todo-123');
    });
  });

  describe('pauseTimer and resumeTimer', () => {
    it('should pause the timer', () => {
      useFocusStore.getState().startTimer();
      useFocusStore.getState().pauseTimer();

      expect(useFocusStore.getState().isPaused).toBe(true);
    });

    it('should resume the timer', () => {
      useFocusStore.getState().startTimer();
      useFocusStore.getState().pauseTimer();
      useFocusStore.getState().resumeTimer();

      expect(useFocusStore.getState().isPaused).toBe(false);
    });
  });

  describe('stopTimer', () => {
    it('should stop and reset the timer', () => {
      useFocusStore.getState().startTimer('todo-123');
      useFocusStore.getState().stopTimer();
      const state = useFocusStore.getState();

      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.mode).toBe('work');
      expect(state.focusedTodoId).toBeNull();
    });
  });

  describe('tick', () => {
    it('should decrement time when active and not paused', () => {
      useFocusStore.getState().startTimer();
      useFocusStore.getState().tick();

      expect(useFocusStore.getState().timeRemaining).toBe(25 * 60 - 1);
    });

    it('should not decrement when paused', () => {
      useFocusStore.getState().startTimer();
      useFocusStore.getState().pauseTimer();
      useFocusStore.getState().tick();

      expect(useFocusStore.getState().timeRemaining).toBe(25 * 60);
    });

    it('should not decrement when not active', () => {
      useFocusStore.getState().tick();

      expect(useFocusStore.getState().timeRemaining).toBe(25 * 60);
    });

    it('should transition to short break after work ends', () => {
      useFocusStore.setState({ isActive: true, timeRemaining: 0, mode: 'work' });
      useFocusStore.getState().tick();

      const state = useFocusStore.getState();
      expect(state.mode).toBe('shortBreak');
      expect(state.completedPomodoros).toBe(1);
      expect(state.timeRemaining).toBe(5 * 60);
    });

    it('should transition to long break after 4 pomodoros', () => {
      useFocusStore.setState({
        isActive: true,
        timeRemaining: 0,
        mode: 'work',
        completedPomodoros: 3,
      });
      useFocusStore.getState().tick();

      const state = useFocusStore.getState();
      expect(state.mode).toBe('longBreak');
      expect(state.completedPomodoros).toBe(4);
      expect(state.timeRemaining).toBe(15 * 60);
    });

    it('should transition back to work after break ends', () => {
      useFocusStore.setState({
        isActive: true,
        timeRemaining: 0,
        mode: 'shortBreak',
      });
      useFocusStore.getState().tick();

      const state = useFocusStore.getState();
      expect(state.mode).toBe('work');
      expect(state.timeRemaining).toBe(25 * 60);
    });
  });

  describe('skipToNext', () => {
    it('should skip from work to short break', () => {
      useFocusStore.getState().startTimer();
      useFocusStore.getState().skipToNext();

      const state = useFocusStore.getState();
      expect(state.mode).toBe('shortBreak');
      expect(state.completedPomodoros).toBe(1);
    });

    it('should skip from break to work', () => {
      useFocusStore.setState({ mode: 'shortBreak' });
      useFocusStore.getState().skipToNext();

      expect(useFocusStore.getState().mode).toBe('work');
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      useFocusStore.getState().updateSettings({ workDuration: 30 });

      expect(useFocusStore.getState().settings.workDuration).toBe(30);
    });

    it('should update timeRemaining when not active', () => {
      useFocusStore.getState().updateSettings({ workDuration: 30 });

      expect(useFocusStore.getState().timeRemaining).toBe(30 * 60);
    });

    it('should not update timeRemaining when active', () => {
      useFocusStore.getState().startTimer();
      useFocusStore.getState().updateSettings({ workDuration: 30 });

      // Should still be the old duration
      expect(useFocusStore.getState().timeRemaining).toBe(25 * 60);
    });
  });
});

describe('formatTime', () => {
  it('should format seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(61)).toBe('01:01');
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(1500)).toBe('25:00');
  });

  it('should handle large values', () => {
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(3661)).toBe('61:01');
  });
});
