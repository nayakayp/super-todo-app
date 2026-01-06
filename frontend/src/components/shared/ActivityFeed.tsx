import { useState } from 'react';
import {
  useActivityLog,
  useTodoActivity,
  Activity,
  formatActivityAction,
  getActivityIcon,
  formatRelativeTime,
} from '../../hooks/useActivityLog';
import { cn } from '../../lib/utils';

type ActivityFeedProps = {
  className?: string;
  limit?: number;
};

export function ActivityFeed({ className, limit = 20 }: ActivityFeedProps) {
  const { activities, isLoading, pagination } = useActivityLog({ limit });
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedActivities = expanded ? activities : activities.slice(0, 5);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Activity</h3>
        {pagination && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {pagination.total} total
          </span>
        )}
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No activity yet
        </p>
      ) : (
        <div className="space-y-3">
          {displayedActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}

          {activities.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {expanded ? 'Show less' : `Show ${activities.length - 5} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type ActivityItemProps = {
  activity: Activity;
  compact?: boolean;
};

function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  return (
    <div className={cn('flex items-start gap-3', compact && 'gap-2')}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700',
          compact ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-lg'
        )}
      >
        {getActivityIcon(activity.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-gray-700 dark:text-gray-300', compact ? 'text-xs' : 'text-sm')}>
          <span className="font-medium">{formatActivityAction(activity.action)}</span>
          {activity.todo_title && (
            <>
              {' '}
              <span className="text-gray-500 dark:text-gray-400">
                "{activity.todo_title}"
              </span>
            </>
          )}
        </p>
        {activity.field_name && activity.new_value && !compact && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activity.field_name}: {activity.old_value || 'none'} → {activity.new_value}
          </p>
        )}
        <p className={cn('text-gray-400 dark:text-gray-500', compact ? 'text-[10px]' : 'text-xs')}>
          {formatRelativeTime(activity.created_at)}
        </p>
      </div>
    </div>
  );
}

// Activity history for a specific todo
type TodoActivityHistoryProps = {
  todoId: string;
  className?: string;
};

export function TodoActivityHistory({ todoId, className }: TodoActivityHistoryProps) {
  const { activities, isLoading } = useTodoActivity(todoId);

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-start gap-2 animate-pulse">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">No history available</p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">History</h4>
      {activities.slice(0, 10).map((activity) => (
        <ActivityItem key={activity.id} activity={activity} compact />
      ))}
    </div>
  );
}

// Activity timeline view
type ActivityTimelineProps = {
  activities: Activity[];
  className?: string;
};

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  // Group activities by date
  const groupedByDate = activities.reduce((acc, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedByDate).map(([date, dayActivities]) => (
        <div key={date}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sticky top-0 bg-white dark:bg-gray-800 py-1">
            {date}
          </h4>
          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
            {dayActivities.map((activity) => (
              <div key={activity.id} className="relative">
                <div className="absolute -left-[21px] w-4 h-4 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{formatActivityAction(activity.action)}</span>
                    {activity.todo_title && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {' '}- {activity.todo_title}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(activity.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
