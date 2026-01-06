import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type StreakState = {
  // Streak data
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null; // ISO date string (YYYY-MM-DD)
  streakHistory: { date: string; completedCount: number }[];

  // Goals
  dailyGoal: number;
  weeklyGoal: number;

  // Stats
  totalCompletedAllTime: number;

  // Actions
  recordCompletion: () => void;
  setDailyGoal: (goal: number) => void;
  setWeeklyGoal: (goal: number) => void;
  resetStreak: () => void;
  getStreakStatus: () => 'active' | 'at_risk' | 'broken';
  getTodayCompletions: () => number;
  getWeekCompletions: () => number;
};

const getDateString = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0];
};

const isConsecutiveDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

const isSameDay = (date1: string, date2: string): boolean => {
  return date1 === date2;
};

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      streakHistory: [],
      dailyGoal: 3,
      weeklyGoal: 15,
      totalCompletedAllTime: 0,

      recordCompletion: () => {
        const today = getDateString();
        const { lastCompletionDate, currentStreak, longestStreak, streakHistory } = get();

        // Update history
        const historyEntry = streakHistory.find(h => h.date === today);
        let newHistory: { date: string; completedCount: number }[];

        if (historyEntry) {
          newHistory = streakHistory.map(h =>
            h.date === today ? { ...h, completedCount: h.completedCount + 1 } : h
          );
        } else {
          newHistory = [...streakHistory, { date: today, completedCount: 1 }];
        }

        // Keep only last 365 days of history
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoStr = getDateString(oneYearAgo);
        newHistory = newHistory.filter(h => h.date >= oneYearAgoStr);

        // Calculate new streak
        let newStreak = currentStreak;

        if (!lastCompletionDate) {
          // First ever completion
          newStreak = 1;
        } else if (isSameDay(lastCompletionDate, today)) {
          // Already completed today, streak stays same
        } else if (isConsecutiveDay(lastCompletionDate, today)) {
          // Completed yesterday, streak continues
          newStreak = currentStreak + 1;
        } else {
          // Streak broken, start fresh
          newStreak = 1;
        }

        set({
          currentStreak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          lastCompletionDate: today,
          streakHistory: newHistory,
          totalCompletedAllTime: get().totalCompletedAllTime + 1,
        });
      },

      setDailyGoal: (goal: number) => set({ dailyGoal: Math.max(1, goal) }),

      setWeeklyGoal: (goal: number) => set({ weeklyGoal: Math.max(1, goal) }),

      resetStreak: () => set({
        currentStreak: 0,
        lastCompletionDate: null,
      }),

      getStreakStatus: () => {
        const { lastCompletionDate } = get();
        if (!lastCompletionDate) return 'broken';

        const today = getDateString();
        const yesterday = getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

        if (isSameDay(lastCompletionDate, today)) return 'active';
        if (isSameDay(lastCompletionDate, yesterday)) return 'at_risk';
        return 'broken';
      },

      getTodayCompletions: () => {
        const today = getDateString();
        const entry = get().streakHistory.find(h => h.date === today);
        return entry?.completedCount || 0;
      },

      getWeekCompletions: () => {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAgoStr = getDateString(weekAgo);

        return get().streakHistory
          .filter(h => h.date >= weekAgoStr)
          .reduce((sum, h) => sum + h.completedCount, 0);
      },
    }),
    {
      name: 'streak-storage',
    }
  )
);
