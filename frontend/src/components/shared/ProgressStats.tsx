import { useMemo } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type ProgressStatsProps = {
  todos: Todo[];
  className?: string;
};

export function ProgressStats({ todos, className }: ProgressStatsProps) {
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const overdue = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return new Date(t.due_date) < new Date();
    }).length;
    const highPriority = todos.filter((t) => t.priority === 2 && !t.completed).length;
    const dueToday = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      const today = new Date().toDateString();
      return new Date(t.due_date).toDateString() === today;
    }).length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, overdue, highPriority, dueToday, percentage };
  }, [todos]);

  if (stats.total === 0) return null;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</h3>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.completed}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{stats.active}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-600 dark:text-gray-300">{stats.total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.overdue > 0 || stats.highPriority > 0 || stats.dueToday > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {stats.overdue > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {stats.overdue} overdue
            </div>
          )}
          {stats.dueToday > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {stats.dueToday} due today
            </div>
          )}
          {stats.highPriority > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {stats.highPriority} high priority
            </div>
          )}
        </div>
      )}
    </div>
  );
}
