import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'completed'
  | 'uncompleted'
  | 'deleted'
  | 'restored'
  | 'priority_changed'
  | 'due_date_set'
  | 'due_date_changed'
  | 'due_date_removed'
  | 'project_assigned'
  | 'project_removed'
  | 'tag_added'
  | 'tag_removed'
  | 'subtask_added'
  | 'subtask_completed'
  | 'time_tracked';

export type Activity = {
  id: string;
  user_id: string;
  todo_id: string | null;
  action: ActivityAction;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  todo_title?: string;
  todo_completed?: boolean;
  created_at: string;
};

type ActivitiesResponse = {
  activities: Activity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type ActivitySummaryResponse = {
  by_action: { action: string; count: number }[];
  by_day: { date: string; count: number }[];
  by_todo: { todo_id: string; title: string; count: number }[];
};

export function useActivityLog(options?: {
  todoId?: string;
  action?: ActivityAction;
  limit?: number;
  offset?: number;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.todoId) params.set('todo_id', options.todoId);
      if (options?.action) params.set('action', options.action);
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.offset) params.set('offset', options.offset.toString());

      const response = await api.get<ActivitiesResponse>(`/activity?${params}`);
      return response;
    },
  });

  return {
    activities: data?.activities ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
  };
}

export function useActivitySummary(period: 'day' | 'week' | 'month' = 'week') {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', 'summary', period],
    queryFn: async () => {
      const response = await api.get<ActivitySummaryResponse>(`/activity/summary?period=${period}`);
      return response;
    },
  });

  return {
    summary: data,
    isLoading,
  };
}

export function useTodoActivity(todoId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', 'todo', todoId],
    queryFn: async () => {
      const response = await api.get<{ activities: Activity[] }>(`/activity/todo/${todoId}`);
      return response.activities;
    },
    enabled: !!todoId,
  });

  return {
    activities: data ?? [],
    isLoading,
  };
}

// Helper to format activity action for display
export function formatActivityAction(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    created: 'Created',
    updated: 'Updated',
    completed: 'Completed',
    uncompleted: 'Reopened',
    deleted: 'Deleted',
    restored: 'Restored',
    priority_changed: 'Changed priority',
    due_date_set: 'Set due date',
    due_date_changed: 'Changed due date',
    due_date_removed: 'Removed due date',
    project_assigned: 'Added to project',
    project_removed: 'Removed from project',
    tag_added: 'Added tag',
    tag_removed: 'Removed tag',
    subtask_added: 'Added subtask',
    subtask_completed: 'Completed subtask',
    time_tracked: 'Tracked time',
  };
  return labels[action] || action;
}

// Helper to get activity icon
export function getActivityIcon(action: ActivityAction): string {
  const icons: Record<ActivityAction, string> = {
    created: '✨',
    updated: '✏️',
    completed: '✅',
    uncompleted: '↩️',
    deleted: '🗑️',
    restored: '♻️',
    priority_changed: '🎯',
    due_date_set: '📅',
    due_date_changed: '📅',
    due_date_removed: '📅',
    project_assigned: '📁',
    project_removed: '📁',
    tag_added: '🏷️',
    tag_removed: '🏷️',
    subtask_added: '📝',
    subtask_completed: '☑️',
    time_tracked: '⏱️',
  };
  return icons[action] || '📋';
}

// Helper to format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
