import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Tag } from './useTags';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: number;
  due_date: string | null;
  position: number | null;
  tags: Tag[];
  project_id: string | null;
  recurrence_pattern: RecurrencePattern | null;
  recurrence_interval: number | null;
  recurrence_days_of_week: number[] | null;
  recurrence_end_date: string | null;
  next_occurrence: string | null;
  original_todo_id: string | null;
  total_time_spent: number | null;
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
    mutationFn: (data: {
      title: string;
      description?: string;
      priority?: number;
      due_date?: string;
      recurrence_pattern?: RecurrencePattern;
      recurrence_interval?: number;
      recurrence_days_of_week?: number[];
      recurrence_end_date?: string;
    }) => api.post<TodoResponse>('/todos', data),
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

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; position: number }[]) =>
      api.post<{ success: boolean }>('/todos/reorder', { items }),
    onMutate: async (items) => {
      // Optimistically update the cache
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previousTodos = queryClient.getQueryData<TodosResponse>(['todos']);

      if (previousTodos) {
        const positionMap = new Map(items.map((item) => [item.id, item.position]));
        const updatedTodos = previousTodos.todos.map((todo) => ({
          ...todo,
          position: positionMap.get(todo.id) ?? todo.position,
        }));
        queryClient.setQueryData(['todos'], { todos: updatedTodos });
      }

      return { previousTodos };
    },
    onError: (_err, _items, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const completeRecurringMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ todo: Todo; nextTodo: Todo | null; message?: string }>(`/todos/${id}/complete-recurring`, {}),
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
    reorderTodos: reorderMutation.mutateAsync,
    completeRecurring: completeRecurringMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
