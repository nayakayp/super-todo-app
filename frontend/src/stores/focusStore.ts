import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FocusMode = 'work' | 'shortBreak' | 'longBreak';

type FocusState = {
  isActive: boolean;
  isPaused: boolean;
  mode: FocusMode;
  timeRemaining: number; // in seconds
  completedPomodoros: number;
  focusedTodoId: string | null;
  settings: {
    workDuration: number; // in minutes
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number; // number of pomodoros before long break
  };
  startTimer: (todoId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  skipToNext: () => void;
  updateSettings: (settings: Partial<FocusState['settings']>) => void;
};

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isPaused: false,
      mode: 'work',
      timeRemaining: DEFAULT_SETTINGS.workDuration * 60,
      completedPomodoros: 0,
      focusedTodoId: null,
      settings: DEFAULT_SETTINGS,

      startTimer: (todoId) => {
        const { settings } = get();
        set({
          isActive: true,
          isPaused: false,
          mode: 'work',
          timeRemaining: settings.workDuration * 60,
          focusedTodoId: todoId || null,
        });
      },

      pauseTimer: () => set({ isPaused: true }),
      resumeTimer: () => set({ isPaused: false }),

      stopTimer: () => {
        const { settings } = get();
        set({
          isActive: false,
          isPaused: false,
          mode: 'work',
          timeRemaining: settings.workDuration * 60,
          focusedTodoId: null,
        });
      },

      tick: () => {
        const { timeRemaining, mode, completedPomodoros, settings, isActive, isPaused } = get();

        if (!isActive || isPaused) return;

        if (timeRemaining <= 0) {
          // Timer completed
          if (mode === 'work') {
            const newCompletedPomodoros = completedPomodoros + 1;
            const isLongBreak = newCompletedPomodoros % settings.longBreakInterval === 0;
            const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
            const duration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;

            // Play notification sound
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleW0XQqfm8LxuHQIontvsnnQmCW+68vCmcB4AAA==');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {
              // Ignore audio errors
            }

            set({
              mode: nextMode,
              timeRemaining: duration * 60,
              completedPomodoros: newCompletedPomodoros,
            });
          } else {
            // Break completed, back to work
            set({
              mode: 'work',
              timeRemaining: settings.workDuration * 60,
            });
          }
        } else {
          set({ timeRemaining: timeRemaining - 1 });
        }
      },

      skipToNext: () => {
        const { mode, completedPomodoros, settings } = get();

        if (mode === 'work') {
          const newCompletedPomodoros = completedPomodoros + 1;
          const isLongBreak = newCompletedPomodoros % settings.longBreakInterval === 0;
          const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
          const duration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;

          set({
            mode: nextMode,
            timeRemaining: duration * 60,
            completedPomodoros: newCompletedPomodoros,
          });
        } else {
          set({
            mode: 'work',
            timeRemaining: settings.workDuration * 60,
          });
        }
      },

      updateSettings: (newSettings) => {
        const { settings, mode, isActive } = get();
        const updatedSettings = { ...settings, ...newSettings };

        set({ settings: updatedSettings });

        // Update timeRemaining if not active
        if (!isActive) {
          const duration = mode === 'work'
            ? updatedSettings.workDuration
            : mode === 'shortBreak'
            ? updatedSettings.shortBreakDuration
            : updatedSettings.longBreakDuration;
          set({ timeRemaining: duration * 60 });
        }
      },
    }),
    {
      name: 'focus-storage',
      partialize: (state) => ({
        completedPomodoros: state.completedPomodoros,
        settings: state.settings,
      }),
    }
  )
);

// Format seconds as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
