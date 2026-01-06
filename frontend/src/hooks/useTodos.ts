import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type TodosResponse = { todos: Todo[] };
type TodoResponse = { todo: Todo };

export function useTodos() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get<TodosResponse>('/todos'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; priority?: number; due_date?: string }) =>
      api.post<TodoResponse>('/todos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; completed?: boolean; priority?: number }) =>
      api.patch<TodoResponse>(`/todos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/todos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    todos: data?.todos ?? [],
    isLoading,
    error,
    createTodo: createMutation.mutateAsync,
    updateTodo: updateMutation.mutateAsync,
    deleteTodo: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
