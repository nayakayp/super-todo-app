import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cn } from '../../lib/utils';

// Types
type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'tasks_completed' | 'streak' | 'pomodoros' | 'time_tracked' | 'habits' | 'level';
  unlockedAt?: string;
};

type GamificationStore = {
  xp: number;
  level: number;
  totalTasksCompleted: number;
  totalPomodorosCompleted: number;
  totalMinutesTracked: number;
  longestStreak: number;
  unlockedAchievements: string[];
  addXP: (amount: number) => void;
  recordTaskCompletion: () => void;
  recordPomodoroCompletion: () => void;
  recordTimeTracked: (minutes: number) => void;
  updateStreak: (current: number) => void;
  checkAchievements: () => Achievement[];
};

const XP_PER_LEVEL = 100;
const XP_REWARDS = {
  taskComplete: 10,
  pomodoroComplete: 25,
  habitComplete: 15,
  minuteTracked: 0.5,
};

const ALL_ACHIEVEMENTS: Achievement[] = [
  // Tasks
  { id: 'first-task', name: 'First Step', description: 'Complete your first task', icon: '🎯', requirement: 1, type: 'tasks_completed' },
  { id: 'task-10', name: 'Getting Started', description: 'Complete 10 tasks', icon: '⭐', requirement: 10, type: 'tasks_completed' },
  { id: 'task-50', name: 'Productive', description: 'Complete 50 tasks', icon: '🌟', requirement: 50, type: 'tasks_completed' },
  { id: 'task-100', name: 'Task Master', description: 'Complete 100 tasks', icon: '💫', requirement: 100, type: 'tasks_completed' },
  { id: 'task-500', name: 'Productivity Legend', description: 'Complete 500 tasks', icon: '🏆', requirement: 500, type: 'tasks_completed' },

  // Streaks
  { id: 'streak-3', name: 'On a Roll', description: 'Maintain a 3-day streak', icon: '🔥', requirement: 3, type: 'streak' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', requirement: 7, type: 'streak' },
  { id: 'streak-30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🔥', requirement: 30, type: 'streak' },
  { id: 'streak-100', name: 'Unstoppable', description: 'Maintain a 100-day streak', icon: '💎', requirement: 100, type: 'streak' },

  // Pomodoros
  { id: 'pomo-1', name: 'Focused', description: 'Complete your first pomodoro', icon: '🍅', requirement: 1, type: 'pomodoros' },
  { id: 'pomo-10', name: 'Deep Worker', description: 'Complete 10 pomodoros', icon: '🍅', requirement: 10, type: 'pomodoros' },
  { id: 'pomo-50', name: 'Focus Champion', description: 'Complete 50 pomodoros', icon: '🍅', requirement: 50, type: 'pomodoros' },
  { id: 'pomo-100', name: 'Pomodoro Pro', description: 'Complete 100 pomodoros', icon: '⏱️', requirement: 100, type: 'pomodoros' },

  // Time tracked
  { id: 'time-60', name: 'First Hour', description: 'Track 1 hour of work', icon: '⏰', requirement: 60, type: 'time_tracked' },
  { id: 'time-600', name: '10 Hour Club', description: 'Track 10 hours of work', icon: '⏰', requirement: 600, type: 'time_tracked' },
  { id: 'time-3000', name: '50 Hour Club', description: 'Track 50 hours of work', icon: '⌛', requirement: 3000, type: 'time_tracked' },

  // Levels
  { id: 'level-5', name: 'Rising Star', description: 'Reach level 5', icon: '⬆️', requirement: 5, type: 'level' },
  { id: 'level-10', name: 'Pro', description: 'Reach level 10', icon: '🎖️', requirement: 10, type: 'level' },
  { id: 'level-25', name: 'Elite', description: 'Reach level 25', icon: '👑', requirement: 25, type: 'level' },
  { id: 'level-50', name: 'Legendary', description: 'Reach level 50', icon: '🌟', requirement: 50, type: 'level' },
];

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      totalTasksCompleted: 0,
      totalPomodorosCompleted: 0,
      totalMinutesTracked: 0,
      longestStreak: 0,
      unlockedAchievements: [],

      addXP: (amount) => {
        const { xp, level } = get();
        const newXP = xp + amount;
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
        set({ xp: newXP, level: newLevel > level ? newLevel : level });
      },

      recordTaskCompletion: () => {
        const { addXP, totalTasksCompleted } = get();
        set({ totalTasksCompleted: totalTasksCompleted + 1 });
        addXP(XP_REWARDS.taskComplete);
      },

      recordPomodoroCompletion: () => {
        const { addXP, totalPomodorosCompleted } = get();
        set({ totalPomodorosCompleted: totalPomodorosCompleted + 1 });
        addXP(XP_REWARDS.pomodoroComplete);
      },

      recordTimeTracked: (minutes) => {
        const { addXP, totalMinutesTracked } = get();
        set({ totalMinutesTracked: totalMinutesTracked + minutes });
        addXP(Math.floor(minutes * XP_REWARDS.minuteTracked));
      },

      updateStreak: (current) => {
        const { longestStreak } = get();
        if (current > longestStreak) {
          set({ longestStreak: current });
        }
      },

      checkAchievements: () => {
        const {
          totalTasksCompleted,
          totalPomodorosCompleted,
          totalMinutesTracked,
          longestStreak,
          level,
          unlockedAchievements
        } = get();

        const newlyUnlocked: Achievement[] = [];

        ALL_ACHIEVEMENTS.forEach((achievement) => {
          if (unlockedAchievements.includes(achievement.id)) return;

          let value = 0;
          switch (achievement.type) {
            case 'tasks_completed': value = totalTasksCompleted; break;
            case 'streak': value = longestStreak; break;
            case 'pomodoros': value = totalPomodorosCompleted; break;
            case 'time_tracked': value = totalMinutesTracked; break;
            case 'level': value = level; break;
          }

          if (value >= achievement.requirement) {
            newlyUnlocked.push({ ...achievement, unlockedAt: new Date().toISOString() });
          }
        });

        if (newlyUnlocked.length > 0) {
          set({
            unlockedAchievements: [
              ...unlockedAchievements,
              ...newlyUnlocked.map((a) => a.id),
            ],
          });
        }

        return newlyUnlocked;
      },
    }),
    { name: 'gamification-storage' }
  )
);

// Components
type LevelBadgeProps = {
  className?: string;
};

export function LevelBadge({ className }: LevelBadgeProps) {
  const { level, xp } = useGamificationStore();
  const currentLevelXP = xp % XP_PER_LEVEL;
  const progress = (currentLevelXP / XP_PER_LEVEL) * 100;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
          {level}
        </div>
        <svg className="absolute inset-0 w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-yellow-200/30"
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="text-white"
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${progress}, 100`}
          />
        </svg>
      </div>
      <div className="hidden sm:block">
        <div className="text-xs font-medium text-gray-900 dark:text-white">Level {level}</div>
        <div className="text-xs text-gray-500">{xp} XP</div>
      </div>
    </div>
  );
}

type XPProgressProps = {
  className?: string;
};

export function XPProgress({ className }: XPProgressProps) {
  const { level, xp } = useGamificationStore();
  const currentLevelXP = xp % XP_PER_LEVEL;
  const nextLevelXP = XP_PER_LEVEL;
  const progress = (currentLevelXP / nextLevelXP) * 100;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {level}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Level {level}</div>
            <div className="text-xs text-gray-500">{xp} XP total</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">Level {level + 1}</div>
          <div className="text-xs text-gray-500">{nextLevelXP - currentLevelXP} XP to go</div>
        </div>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

type AchievementsListProps = {
  className?: string;
  showAll?: boolean;
};

export function AchievementsList({ className, showAll = false }: AchievementsListProps) {
  const { unlockedAchievements } = useGamificationStore();

  const achievements = useMemo(() => {
    if (showAll) return ALL_ACHIEVEMENTS;
    return ALL_ACHIEVEMENTS.filter((a) => unlockedAchievements.includes(a.id));
  }, [unlockedAchievements, showAll]);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>🏆</span>
        Achievements
        <span className="text-sm font-normal text-gray-500">
          ({unlockedAchievements.length}/{ALL_ACHIEVEMENTS.length})
        </span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {achievements.map((achievement) => {
          const isUnlocked = unlockedAchievements.includes(achievement.id);
          return (
            <div
              key={achievement.id}
              className={cn(
                'relative p-3 rounded-lg text-center transition-all',
                isUnlocked
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                  : 'bg-gray-100 dark:bg-gray-700/50 opacity-50'
              )}
              title={`${achievement.description}${isUnlocked ? ' (Unlocked!)' : ''}`}
            >
              <div className={cn(
                'text-3xl mb-1',
                !isUnlocked && 'filter grayscale'
              )}>
                {achievement.icon}
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {achievement.name}
              </div>
              {isUnlocked && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px]">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type StatsCardProps = {
  className?: string;
};

export function GamificationStats({ className }: StatsCardProps) {
  const { totalTasksCompleted, totalPomodorosCompleted, totalMinutesTracked, longestStreak } = useGamificationStore();

  const stats = [
    { label: 'Tasks Done', value: totalTasksCompleted, icon: '✅' },
    { label: 'Pomodoros', value: totalPomodorosCompleted, icon: '🍅' },
    { label: 'Hours Tracked', value: Math.floor(totalMinutesTracked / 60), icon: '⏱️' },
    { label: 'Best Streak', value: longestStreak, icon: '🔥' },
  ];

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 text-center"
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
          <div className="text-xs text-gray-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Achievement unlock notification
type AchievementNotificationProps = {
  achievement: Achievement;
  onClose: () => void;
};

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-xl p-4 text-white max-w-sm">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{achievement.icon}</div>
          <div className="flex-1">
            <div className="font-bold text-lg">Achievement Unlocked!</div>
            <div className="font-medium">{achievement.name}</div>
            <div className="text-sm text-yellow-100">{achievement.description}</div>
          </div>
          <button
            onClick={onClose}
            className="text-yellow-100 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact badge for header
export function AchievementBadge() {
  const { unlockedAchievements } = useGamificationStore();

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
      <span>🏆</span>
      <span>{unlockedAchievements.length}</span>
    </div>
  );
}
