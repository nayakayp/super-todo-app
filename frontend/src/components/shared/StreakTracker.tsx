import { useStreakStore } from '../../stores/streakStore';
import { cn } from '../../lib/utils';

type StreakDisplayProps = {
  className?: string;
};

export function StreakDisplay({ className }: StreakDisplayProps) {
  const {
    currentStreak,
    longestStreak,
    dailyGoal,
    weeklyGoal,
    getTodayCompletions,
    getWeekCompletions,
    getStreakStatus,
  } = useStreakStore();

  const todayCompletions = getTodayCompletions();
  const weekCompletions = getWeekCompletions();
  const streakStatus = getStreakStatus();
  const dailyProgress = Math.min(100, (todayCompletions / dailyGoal) * 100);
  const weeklyProgress = Math.min(100, (weekCompletions / weeklyGoal) * 100);

  const statusConfig = {
    active: {
      icon: '🔥',
      text: 'On Fire!',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    at_risk: {
      icon: '⚡',
      text: 'Complete a task!',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    broken: {
      icon: '💪',
      text: 'Start a new streak!',
      bgColor: 'bg-gray-50 dark:bg-gray-900/50',
      textColor: 'text-gray-500 dark:text-gray-400',
    },
  };

  const status = statusConfig[streakStatus];

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      {/* Streak Header */}
      <div className={cn('rounded-lg p-3 mb-4', status.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{status.icon}</span>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
              </div>
              <div className={cn('text-xs', status.textColor)}>{status.text}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Best</div>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {longestStreak}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Today's Goal</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {todayCompletions}/{dailyGoal}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              dailyProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
        {dailyProgress >= 100 && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <span>✅</span> Daily goal achieved!
          </div>
        )}
      </div>

      {/* Weekly Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Goal</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {weekCompletions}/{weeklyGoal}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              weeklyProgress >= 100 ? 'bg-green-500' : 'bg-purple-500'
            )}
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        {weeklyProgress >= 100 && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <span>🏆</span> Weekly goal achieved!
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for sidebar
export function StreakBadge({ className }: { className?: string }) {
  const { currentStreak, getStreakStatus } = useStreakStore();
  const status = getStreakStatus();

  const statusStyles = {
    active: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    at_risk: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    broken: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-sm', statusStyles[status], className)}>
      <span>{status === 'active' ? '🔥' : status === 'at_risk' ? '⚡' : '💪'}</span>
      <span className="font-medium">{currentStreak}</span>
    </div>
  );
}

// Goals Settings modal component
type GoalsSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GoalsSettings({ isOpen, onClose }: GoalsSettingsProps) {
  const { dailyGoal, weeklyGoal, setDailyGoal, setWeeklyGoal, totalCompletedAllTime, longestStreak } = useStreakStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Goal Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Goal (tasks per day)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weekly Goal (tasks per week)
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              All-Time Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {totalCompletedAllTime}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {longestStreak}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Best Streak</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Heat map calendar for activity
type StreakCalendarProps = {
  className?: string;
};

export function StreakCalendar({ className }: StreakCalendarProps) {
  const { streakHistory } = useStreakStore();

  // Generate last 12 weeks of dates
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();

  for (let w = 11; w >= 0; w--) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (6 - d)));
      const dateStr = date.toISOString().split('T')[0];
      const entry = streakHistory.find(h => h.date === dateStr);
      week.push({ date: dateStr, count: entry?.completedCount || 0 });
    }
    weeks.push(week);
  }

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (count === 1) return 'bg-green-200 dark:bg-green-900/50';
    if (count <= 3) return 'bg-green-400 dark:bg-green-700';
    if (count <= 5) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-600 dark:bg-green-500';
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Activity (Last 12 Weeks)
      </h3>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={cn('w-3 h-3 rounded-sm', getColorClass(day.count))}
                title={`${day.date}: ${day.count} task${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/50" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
