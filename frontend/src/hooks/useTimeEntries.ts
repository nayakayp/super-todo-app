import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type TimeEntry = {
  id: string;
  todo_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  description: string | null;
  todo_title?: string;
  created_at: string;
  updated_at: string;
};

export type TimeSummary = {
  total_entries: number;
  total_seconds: number | null;
  avg_seconds: number | null;
  min_seconds: number | null;
  max_seconds: number | null;
  todos_worked_on: number;
  days_worked: number;
};

export type TimeSummaryResponse = {
  summary: TimeSummary;
  by_todo: { id: string; title: string; total_seconds: number; entry_count: number }[];
  by_day: { date: string; total_seconds: number; entry_count: number }[];
};

type EntriesResponse = { entries: TimeEntry[] };
type EntryResponse = { entry: TimeEntry };
type ActiveResponse = { entry: TimeEntry | null };

export function useTimeEntries(todoId?: string) {
  const queryClient = useQueryClient();

  // Get entries for a specific todo
  const { data: entries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ['time-entries', todoId],
    queryFn: async () => {
      if (!todoId) return [];
      const response = await api.get<EntriesResponse>(`/time-entries/todo/${todoId}`);
      return response.entries;
    },
    enabled: !!todoId,
  });

  // Get active time entry
  const { data: activeEntry, isLoading: isLoadingActive } = useQuery({
    queryKey: ['time-entries', 'active'],
    queryFn: async () => {
      const response = await api.get<ActiveResponse>('/time-entries/active');
      return response.entry;
    },
    refetchInterval: 1000, // Refresh every second to update timer
  });

  // Get time summary
  const useSummary = (period: 'day' | 'week' | 'month' = 'week') => {
    return useQuery({
      queryKey: ['time-entries', 'summary', period],
      queryFn: async () => {
        const response = await api.get<TimeSummaryResponse>(`/time-entries/summary?period=${period}`);
        return response;
      },
    });
  };

  // Start tracking
  const startMutation = useMutation({
    mutationFn: async ({ todoId, description }: { todoId: string; description?: string }) => {
      const response = await api.post<EntryResponse>('/time-entries/start', {
        todo_id: todoId,
        description,
      });
      return response.entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  // Stop tracking
  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<EntryResponse>('/time-entries/stop', {});
      return response.entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] }); // Refresh total_time_spent
    },
  });

  // Add manual entry
  const addManualMutation = useMutation({
    mutationFn: async (data: {
      todoId: string;
      duration_seconds?: number;
      started_at?: string;
      ended_at?: string;
      description?: string;
    }) => {
      const response = await api.post<EntryResponse>('/time-entries/manual', {
        todo_id: data.todoId,
        duration_seconds: data.duration_seconds,
        started_at: data.started_at,
        ended_at: data.ended_at,
        description: data.description,
      });
      return response.entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // Update entry
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; description?: string; duration_seconds?: number }) => {
      const response = await api.patch<EntryResponse>(`/time-entries/${id}`, updates);
      return response.entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  // Delete entry
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    entries,
    activeEntry,
    isLoading: isLoadingEntries || isLoadingActive,
    useSummary,
    startTracking: startMutation.mutateAsync,
    stopTracking: stopMutation.mutateAsync,
    addManualEntry: addManualMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
}

// Helper to format duration
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// Helper to format duration as HH:MM:SS
export function formatDurationHMS(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}
