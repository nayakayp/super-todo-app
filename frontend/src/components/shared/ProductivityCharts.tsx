import { useMemo } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type ProductivityChartsProps = {
  todos: Todo[];
  className?: string;
};

export function ProductivityCharts({ todos, className }: ProductivityChartsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Last 14 days of activity
    const dailyActivity: { date: string; created: number; completed: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const created = todos.filter((t) => {
        const d = new Date(t.created_at);
        return d >= date && d < nextDate;
      }).length;

      const completed = todos.filter((t) => {
        if (!t.completed) return false;
        const d = new Date(t.updated_at);
        return d >= date && d < nextDate;
      }).length;

      dailyActivity.push({ date: dateStr, created, completed });
    }

    // Priority distribution
    const priorityDist = [0, 0, 0, 0];
    todos.filter((t) => !t.completed).forEach((t) => {
      if (t.priority >= 0 && t.priority <= 3) {
        priorityDist[t.priority]++;
      }
    });

    // Completion velocity (tasks completed per day over last 7 days)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const completedThisWeek = todos.filter((t) => {
      if (!t.completed) return false;
      return new Date(t.updated_at) >= weekAgo;
    }).length;
    const velocity = (completedThisWeek / 7).toFixed(1);

    // Task age distribution
    const ageDist = { fresh: 0, recent: 0, old: 0, ancient: 0 };
    todos.filter((t) => !t.completed).forEach((t) => {
      const age = Math.floor((now.getTime() - new Date(t.created_at).getTime()) / (24 * 60 * 60 * 1000));
      if (age <= 1) ageDist.fresh++;
      else if (age <= 7) ageDist.recent++;
      else if (age <= 30) ageDist.old++;
      else ageDist.ancient++;
    });

    return { dailyActivity, priorityDist, velocity, completedThisWeek, ageDist };
  }, [todos]);

  const maxActivity = Math.max(
    ...stats.dailyActivity.map((d) => Math.max(d.created, d.completed)),
    1
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          14-Day Activity
        </h3>
        <div className="flex items-end gap-1 h-32">
          {stats.dailyActivity.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 justify-center h-24">
                <div
                  className="w-1/3 bg-blue-500 rounded-t transition-all"
                  style={{ height: `${(day.created / maxActivity) * 100}%`, minHeight: day.created > 0 ? '2px' : '0' }}
                  title={`Created: ${day.created}`}
                />
                <div
                  className="w-1/3 bg-green-500 rounded-t transition-all"
                  style={{ height: `${(day.completed / maxActivity) * 100}%`, minHeight: day.completed > 0 ? '2px' : '0' }}
                  title={`Completed: ${day.completed}`}
                />
              </div>
              {i % 2 === 0 && (
                <span className="text-[8px] text-gray-400 truncate w-full text-center">
                  {day.date.split(' ')[1]}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">Created</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-gray-500 dark:text-gray-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Velocity & Priority */}
      <div className="grid grid-cols-2 gap-4">
        {/* Velocity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Velocity
          </h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.velocity}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            tasks/day (7-day avg)
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.completedThisWeek} completed this week
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority Mix
          </h3>
          <div className="flex h-8 rounded overflow-hidden">
            {stats.priorityDist[3] > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(stats.priorityDist[3] / (stats.priorityDist.reduce((a, b) => a + b, 0) || 1)) * 100}%` }}
                title={`Critical: ${stats.priorityDist[3]}`}
              />
            )}
            {stats.priorityDist[2] > 0 && (
              <div
                className="bg-orange-500"
                style={{ width: `${(stats.priorityDist[2] / (stats.priorityDist.reduce((a, b) => a + b, 0) || 1)) * 100}%` }}
                title={`High: ${stats.priorityDist[2]}`}
              />
            )}
            {stats.priorityDist[1] > 0 && (
              <div
                className="bg-yellow-500"
                style={{ width: `${(stats.priorityDist[1] / (stats.priorityDist.reduce((a, b) => a + b, 0) || 1)) * 100}%` }}
                title={`Medium: ${stats.priorityDist[1]}`}
              />
            )}
            {stats.priorityDist[0] > 0 && (
              <div
                className="bg-gray-400"
                style={{ width: `${(stats.priorityDist[0] / (stats.priorityDist.reduce((a, b) => a + b, 0) || 1)) * 100}%` }}
                title={`Low: ${stats.priorityDist[0]}`}
              />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Critical: {stats.priorityDist[3]}</span>
            <span>High: {stats.priorityDist[2]}</span>
            <span>Med: {stats.priorityDist[1]}</span>
            <span>Low: {stats.priorityDist[0]}</span>
          </div>
        </div>
      </div>

      {/* Task Age Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Task Age (Active Tasks)
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {stats.ageDist.fresh}
            </div>
            <div className="text-[10px] text-gray-500">Fresh (≤1d)</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {stats.ageDist.recent}
            </div>
            <div className="text-[10px] text-gray-500">Recent (≤7d)</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {stats.ageDist.old}
            </div>
            <div className="text-[10px] text-gray-500">Old (≤30d)</div>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {stats.ageDist.ancient}
            </div>
            <div className="text-[10px] text-gray-500">Ancient (&gt;30d)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
