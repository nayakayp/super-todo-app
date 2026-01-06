import { useMemo } from 'react';
import { useTodos } from '../hooks/useTodos';
import { useFocusStore } from '../stores/focusStore';
import { useNavigate } from 'react-router-dom';
import { EisenhowerMatrix, WeeklyReview, StreakCalendar, ProductivityCharts } from '../components/shared';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
};

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max === 0 ? 0 : (value / max) * 100;
  return (
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function StatsPage() {
  const { todos, isLoading } = useTodos();
  const completedPomodoros = useFocusStore((state) => state.completedPomodoros);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Priority breakdown
    const byPriority = {
      critical: todos.filter((t) => t.priority === 3).length,
      high: todos.filter((t) => t.priority === 2).length,
      medium: todos.filter((t) => t.priority === 1).length,
      low: todos.filter((t) => t.priority === 0).length,
    };

    // Due date analysis
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdue = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return new Date(t.due_date) < today;
    }).length;

    const dueToday = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      const due = new Date(t.due_date);
      return due >= today && due < tomorrow;
    }).length;

    const dueThisWeek = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      const due = new Date(t.due_date);
      return due >= today && due < nextWeek;
    }).length;

    // Created stats
    const todayTodos = todos.filter((t) => {
      const created = new Date(t.created_at);
      return created >= today;
    }).length;

    const thisWeekTodos = todos.filter((t) => {
      const created = new Date(t.created_at);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return created >= weekAgo;
    }).length;

    // Completed this week
    const completedThisWeek = todos.filter((t) => {
      if (!t.completed) return false;
      const updated = new Date(t.updated_at);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return updated >= weekAgo;
    }).length;

    // Tags analysis
    const tagCounts: Record<string, number> = {};
    todos.forEach((t) => {
      t.tags?.forEach((tag) => {
        tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Recent activity (last 7 days)
    const last7Days: { date: string; created: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const created = todos.filter((t) => {
        const d = new Date(t.created_at);
        return d >= date && d < nextDate;
      }).length;

      const completed = todos.filter((t) => {
        if (!t.completed) return false;
        const d = new Date(t.updated_at);
        return d >= date && d < nextDate;
      }).length;

      last7Days.push({ date: dateStr, created, completed });
    }

    return {
      total,
      completed,
      active,
      completionRate,
      byPriority,
      overdue,
      dueToday,
      dueThisWeek,
      todayTodos,
      thisWeekTodos,
      completedThisWeek,
      topTags,
      last7Days,
    };
  }, [todos]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Todos"
            value={stats.total}
            subtitle={`${stats.todayTodos} created today`}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            subtitle={`${stats.completionRate}% completion rate`}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Active"
            value={stats.active}
            subtitle={`${stats.overdue} overdue`}
            color={stats.overdue > 0 ? 'red' : 'yellow'}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Focus Sessions"
            value={completedPomodoros}
            subtitle="Pomodoros completed"
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Priority Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600 dark:text-red-400 font-medium">Critical</span>
                <span className="text-gray-500">{stats.byPriority.critical}</span>
              </div>
              <ProgressBar value={stats.byPriority.critical} max={stats.total} color="bg-red-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-orange-600 dark:text-orange-400 font-medium">High</span>
                <span className="text-gray-500">{stats.byPriority.high}</span>
              </div>
              <ProgressBar value={stats.byPriority.high} max={stats.total} color="bg-orange-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Medium</span>
                <span className="text-gray-500">{stats.byPriority.medium}</span>
              </div>
              <ProgressBar value={stats.byPriority.medium} max={stats.total} color="bg-yellow-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Low</span>
                <span className="text-gray-500">{stats.byPriority.low}</span>
              </div>
              <ProgressBar value={stats.byPriority.low} max={stats.total} color="bg-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Activity</h2>
            <div className="flex items-end justify-between gap-2 h-40">
              {stats.last7Days.map((day, i) => {
                const maxValue = Math.max(
                  ...stats.last7Days.map((d) => Math.max(d.created, d.completed)),
                  1
                );
                const createdHeight = (day.created / maxValue) * 100;
                const completedHeight = (day.completed / maxValue) * 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex-1 w-full flex items-end gap-0.5 justify-center">
                      <div
                        className="w-2 bg-blue-500 rounded-t"
                        style={{ height: `${createdHeight}%`, minHeight: day.created > 0 ? '4px' : '0' }}
                        title={`Created: ${day.created}`}
                      />
                      <div
                        className="w-2 bg-green-500 rounded-t"
                        style={{ height: `${completedHeight}%`, minHeight: day.completed > 0 ? '4px' : '0' }}
                        title={`Completed: ${day.completed}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{day.date}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-gray-600 dark:text-gray-400">Created</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
              </div>
            </div>
          </div>

          {/* Due Date Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Due Dates</h2>
            <div className="space-y-4">
              {stats.overdue > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-red-700 dark:text-red-300 font-medium">Overdue</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-yellow-700 dark:text-yellow-300 font-medium">Due Today</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.dueToday}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Due This Week</span>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.dueThisWeek}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Tags */}
        {stats.topTags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top Tags</h2>
            <div className="flex flex-wrap gap-3">
              {stats.topTags.map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">This Week Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.thisWeekTodos}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Todos Created</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedThisWeek}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Todos Completed</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.thisWeekTodos === 0 ? 0 : Math.round((stats.completedThisWeek / stats.thisWeekTodos) * 100)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Productivity Rate</p>
            </div>
          </div>
        </div>

        {/* Eisenhower Matrix */}
        <EisenhowerMatrix todos={todos} />

        {/* Activity Heat Map */}
        <StreakCalendar />

        {/* Productivity Charts */}
        <ProductivityCharts todos={todos} />

        {/* Weekly Review */}
        <WeeklyReview todos={todos} />
      </main>
    </div>
  );
}
