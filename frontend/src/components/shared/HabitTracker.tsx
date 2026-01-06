import { useState, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cn } from '../../lib/utils';

// Types
type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly';
  targetDays?: number[]; // 0 = Sunday, 6 = Saturday
  createdAt: string;
};

type HabitCompletion = {
  habitId: string;
  date: string; // YYYY-MM-DD
};

type HabitStore = {
  habits: Habit[];
  completions: HabitCompletion[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  removeHabit: (id: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  toggleCompletion: (habitId: string, date: string) => void;
  isCompleted: (habitId: string, date: string) => boolean;
  getStreak: (habitId: string) => number;
  getCompletionRate: (habitId: string, days: number) => number;
};

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: [],
      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },
      removeHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.filter((c) => c.habitId !== id),
        }));
      },
      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));
      },
      toggleCompletion: (habitId, date) => {
        const { completions, isCompleted } = get();
        if (isCompleted(habitId, date)) {
          set({
            completions: completions.filter((c) => !(c.habitId === habitId && c.date === date)),
          });
        } else {
          set({
            completions: [...completions, { habitId, date }],
          });
        }
      },
      isCompleted: (habitId, date) => {
        return get().completions.some((c) => c.habitId === habitId && c.date === date);
      },
      getStreak: (habitId) => {
        const { completions, habits } = get();
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return 0;

        const habitCompletions = completions
          .filter((c) => c.habitId === habitId)
          .map((c) => c.date)
          .sort()
          .reverse();

        if (habitCompletions.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();

          // Check if this day applies to the habit
          let shouldCheck = true;
          if (habit.frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
            shouldCheck = false;
          } else if (habit.frequency === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) {
            shouldCheck = false;
          } else if (habit.targetDays && !habit.targetDays.includes(dayOfWeek)) {
            shouldCheck = false;
          }

          if (shouldCheck) {
            if (habitCompletions.includes(dateStr)) {
              streak++;
            } else if (i > 0) {
              break;
            }
          }
        }

        return streak;
      },
      getCompletionRate: (habitId, days) => {
        const { completions, habits } = get();
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return 0;

        let applicableDays = 0;
        let completedDays = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();

          let shouldCheck = true;
          if (habit.frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
            shouldCheck = false;
          } else if (habit.frequency === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) {
            shouldCheck = false;
          } else if (habit.targetDays && !habit.targetDays.includes(dayOfWeek)) {
            shouldCheck = false;
          }

          if (shouldCheck) {
            applicableDays++;
            if (completions.some((c) => c.habitId === habitId && c.date === dateStr)) {
              completedDays++;
            }
          }
        }

        return applicableDays > 0 ? Math.round((completedDays / applicableDays) * 100) : 0;
      },
    }),
    { name: 'habit-storage' }
  )
);

// Preset icons and colors
const HABIT_ICONS = ['💧', '🏃', '📚', '🧘', '💪', '🎯', '✍️', '🎨', '🎵', '💤', '🥗', '💊'];
const HABIT_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
];

// Components
type HabitTrackerProps = {
  className?: string;
};

export function HabitTracker({ className }: HabitTrackerProps) {
  const { habits, toggleCompletion, isCompleted, getStreak } = useHabitStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Generate last 7 days
  const last7Days = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🎯</span>
          Habit Tracker
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          + Add Habit
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p>No habits yet</p>
          <p className="text-xs mt-1">Add habits to track daily routines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Days header */}
          <div className="grid grid-cols-[1fr,repeat(7,32px)] gap-1 mb-2">
            <div></div>
            {last7Days.map((date) => {
              const d = new Date(date);
              const isToday = date === today;
              return (
                <div
                  key={date}
                  className={cn(
                    'text-center text-xs',
                    isToday ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'
                  )}
                >
                  {d.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
                </div>
              );
            })}
          </div>

          {/* Habit rows */}
          {habits.map((habit) => (
            <div key={habit.id} className="grid grid-cols-[1fr,repeat(7,32px)] gap-1 items-center">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {habit.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getStreak(habit.id)} day streak
                  </div>
                </div>
              </div>
              {last7Days.map((date) => {
                const completed = isCompleted(habit.id, date);
                return (
                  <button
                    key={date}
                    onClick={() => toggleCompletion(habit.id, date)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all flex items-center justify-center text-xs',
                      completed
                        ? `${habit.color} text-white`
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {completed && '✓'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

// Add Habit Modal
function AddHabitModal({ onClose }: { onClose: () => void }) {
  const { addHabit } = useHabitStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('bg-blue-500');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({ name: name.trim(), icon, color, frequency });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add New Habit
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {HABIT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                    icon === i
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full',
                    c,
                    color === c && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white'
                  )}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Habit['frequency'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="daily">Every Day</option>
              <option value="weekdays">Weekdays Only</option>
              <option value="weekends">Weekends Only</option>
              <option value="weekly">Once a Week</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Compact widget version
export function HabitWidget({ className }: { className?: string }) {
  const { habits, isCompleted, getStreak } = useHabitStore();
  const today = new Date().toISOString().split('T')[0];

  const todayProgress = useMemo(() => {
    if (habits.length === 0) return { completed: 0, total: 0 };
    const completed = habits.filter((h) => isCompleted(h.id, today)).length;
    return { completed, total: habits.length };
  }, [habits, isCompleted, today]);

  const totalStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.min(...habits.map((h) => getStreak(h.id)));
  }, [habits, getStreak]);

  if (habits.length === 0) return null;

  const percentage = (todayProgress.completed / todayProgress.total) * 100;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-3', className)}>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200 dark:text-gray-700"
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-green-500"
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
            {todayProgress.completed}/{todayProgress.total}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            Today's Habits
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalStreak > 0 ? `${totalStreak} day streak` : 'Keep going!'}
          </div>
        </div>
      </div>
    </div>
  );
}
