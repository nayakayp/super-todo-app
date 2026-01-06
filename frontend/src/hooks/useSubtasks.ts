import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type Subtask = {
  id: string;
  todo_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type SubtasksResponse = { subtasks: Subtask[] };
type SubtaskResponse = { subtask: Subtask };

export function useSubtasks(todoId: string | null) {
  const queryClient = useQueryClient();

  const { data: subtasks = [], isLoading } = useQuery({
    queryKey: ['subtasks', todoId],
    queryFn: async () => {
      if (!todoId) return [];
      const response = await api.get<SubtasksResponse>(`/subtasks/todo/${todoId}`);
      return response.subtasks;
    },
    enabled: !!todoId,
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async ({ todoId, title }: { todoId: string; title: string }) => {
      const response = await api.post<SubtaskResponse>(`/subtasks/todo/${todoId}`, { title });
      return response.subtask;
    },
    onSuccess: (_, { todoId }) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', todoId] });
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; completed?: boolean }) => {
      const response = await api.patch<SubtaskResponse>(`/subtasks/${id}`, updates);
      return response.subtask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', todoId] });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subtasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', todoId] });
    },
  });

  const toggleAllMutation = useMutation({
    mutationFn: async ({ todoId, completed }: { todoId: string; completed: boolean }) => {
      await api.post(`/subtasks/todo/${todoId}/toggle-all`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', todoId] });
    },
  });

  return {
    subtasks,
    isLoading,
    createSubtask: createSubtaskMutation.mutateAsync,
    updateSubtask: updateSubtaskMutation.mutateAsync,
    deleteSubtask: deleteSubtaskMutation.mutateAsync,
    toggleAll: toggleAllMutation.mutateAsync,
    isCreating: createSubtaskMutation.isPending,
  };
}
