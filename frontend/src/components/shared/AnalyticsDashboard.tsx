import { useMemo } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type AnalyticsDashboardProps = {
  todos: Todo[];
  className?: string;
};

export function AnalyticsDashboard({ todos, className }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Basic counts
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const overdue = todos.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < now).length;

    // Time-based stats
    const completedThisWeek = todos.filter(
      (t) => t.completed && t.updated_at && new Date(t.updated_at) > weekAgo
    ).length;
    const completedThisMonth = todos.filter(
      (t) => t.completed && t.updated_at && new Date(t.updated_at) > monthAgo
    ).length;
    const createdThisWeek = todos.filter((t) => new Date(t.created_at) > weekAgo).length;
    const createdThisMonth = todos.filter((t) => new Date(t.created_at) > monthAgo).length;

    // Priority breakdown
    const byPriority = {
      critical: todos.filter((t) => t.priority === 3).length,
      high: todos.filter((t) => t.priority === 2).length,
      medium: todos.filter((t) => t.priority === 1).length,
      low: todos.filter((t) => t.priority === 0).length,
    };

    // Due date breakdown
    const dueToday = todos.filter(
      (t) => !t.completed && t.due_date && t.due_date.split('T')[0] === today
    ).length;
    const dueThisWeek = todos.filter((t) => {
      if (t.completed || !t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate > now && dueDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }).length;
    const noDueDate = todos.filter((t) => !t.completed && !t.due_date).length;

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Average age of open tasks (in days)
    const openTasks = todos.filter((t) => !t.completed);
    const avgAge = openTasks.length > 0
      ? Math.round(
          openTasks.reduce((sum, t) => {
            const age = (now.getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
            return sum + age;
          }, 0) / openTasks.length
        )
      : 0;

    // Daily completion trend (last 7 days)
    const dailyTrend: { date: string; completed: number; created: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyTrend.push({
        date: dateStr,
        completed: todos.filter(
          (t) => t.completed && t.updated_at && t.updated_at.split('T')[0] === dateStr
        ).length,
        created: todos.filter((t) => t.created_at.split('T')[0] === dateStr).length,
      });
    }

    return {
      total,
      completed,
      active,
      overdue,
      completedThisWeek,
      completedThisMonth,
      createdThisWeek,
      createdThisMonth,
      byPriority,
      dueToday,
      dueThisWeek,
      noDueDate,
      completionRate,
      avgAge,
      dailyTrend,
    };
  }, [todos]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={analytics.total}
          icon="📋"
          color="blue"
        />
        <StatCard
          label="Completed"
          value={analytics.completed}
          icon="✅"
          color="green"
          sublabel={`${analytics.completionRate}%`}
        />
        <StatCard
          label="Active"
          value={analytics.active}
          icon="🔄"
          color="yellow"
        />
        <StatCard
          label="Overdue"
          value={analytics.overdue}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            This Week
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.completedThisWeek}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.createdThisWeek}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Progress</div>
            <div className={cn(
              'text-lg font-bold',
              analytics.completedThisWeek >= analytics.createdThisWeek
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}>
              {analytics.completedThisWeek >= analytics.createdThisWeek ? '+' : ''}
              {analytics.completedThisWeek - analytics.createdThisWeek} tasks
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Due Dates
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Due Today</span>
              <span className={cn(
                'px-2 py-1 rounded text-sm font-medium',
                analytics.dueToday > 0
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}>
                {analytics.dueToday}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Due This Week</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded text-sm font-medium">
                {analytics.dueThisWeek}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Overdue</span>
              <span className={cn(
                'px-2 py-1 rounded text-sm font-medium',
                analytics.overdue > 0
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              )}>
                {analytics.overdue}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">No Due Date</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded text-sm font-medium">
                {analytics.noDueDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Priority Distribution
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <PriorityBar
            label="Critical"
            count={analytics.byPriority.critical}
            total={analytics.total}
            color="red"
          />
          <PriorityBar
            label="High"
            count={analytics.byPriority.high}
            total={analytics.total}
            color="orange"
          />
          <PriorityBar
            label="Medium"
            count={analytics.byPriority.medium}
            total={analytics.total}
            color="yellow"
          />
          <PriorityBar
            label="Low"
            count={analytics.byPriority.low}
            total={analytics.total}
            color="gray"
          />
        </div>
      </div>

      {/* 7-Day Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          7-Day Activity
        </h3>
        <div className="flex items-end justify-between h-32 gap-1">
          {analytics.dailyTrend.map((day, i) => {
            const maxVal = Math.max(...analytics.dailyTrend.map((d) => Math.max(d.completed, d.created)), 1);
            const completedHeight = (day.completed / maxVal) * 100;
            const createdHeight = (day.created / maxVal) * 100;
            const date = new Date(day.date);
            const isToday = i === analytics.dailyTrend.length - 1;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-24 flex items-end gap-0.5">
                  <div
                    className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-t"
                    style={{ height: `${createdHeight}%` }}
                    title={`Created: ${day.created}`}
                  />
                  <div
                    className="flex-1 bg-green-500 rounded-t"
                    style={{ height: `${completedHeight}%` }}
                    title={`Completed: ${day.completed}`}
                  />
                </div>
                <div className={cn(
                  'text-xs',
                  isToday ? 'text-blue-600 font-medium' : 'text-gray-400'
                )}>
                  {date.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded" />
            <span className="text-xs text-gray-500">Created</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Insights
        </h3>
        <div className="space-y-3">
          <Insight
            icon="📊"
            text={`Your completion rate is ${analytics.completionRate}%`}
            type={analytics.completionRate >= 80 ? 'success' : analytics.completionRate >= 50 ? 'warning' : 'danger'}
          />
          <Insight
            icon="⏳"
            text={`Average task age is ${analytics.avgAge} days`}
            type={analytics.avgAge <= 7 ? 'success' : analytics.avgAge <= 14 ? 'warning' : 'danger'}
          />
          {analytics.overdue > 0 && (
            <Insight
              icon="⚠️"
              text={`You have ${analytics.overdue} overdue task${analytics.overdue > 1 ? 's' : ''}`}
              type="danger"
            />
          )}
          {analytics.completedThisWeek > analytics.createdThisWeek && (
            <Insight
              icon="🎉"
              text="You're completing more tasks than you're creating!"
              type="success"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components
function StatCard({
  label,
  value,
  icon,
  color,
  sublabel,
}: {
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  sublabel?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xl', colorClasses[color])}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            {label}
            {sublabel && <span className="text-xs text-gray-400">({sublabel})</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: 'red' | 'orange' | 'yellow' | 'gray';
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-400',
  };

  return (
    <div className="text-center">
      <div className="h-20 flex items-end justify-center mb-2">
        <div
          className={cn('w-8 rounded-t transition-all', colorClasses[color])}
          style={{ height: `${Math.max(percentage, 5)}%` }}
        />
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{count}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Insight({
  icon,
  text,
  type,
}: {
  icon: string;
  text: string;
  type: 'success' | 'warning' | 'danger';
}) {
  const bgClasses = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border', bgClasses[type])}>
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
    </div>
  );
}
