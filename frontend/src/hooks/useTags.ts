import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

type TagsResponse = { tags: Tag[] };
type TagResponse = { tag: Tag };

export function useTags() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<TagsResponse>('/tags'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      api.post<TagResponse>('/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string }) =>
      api.patch<TagResponse>(`/tags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const addTagToTodoMutation = useMutation({
    mutationFn: ({ todoId, tagId }: { todoId: string; tagId: string }) =>
      api.post<{ success: boolean }>(`/tags/todo/${todoId}/tag/${tagId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const removeTagFromTodoMutation = useMutation({
    mutationFn: ({ todoId, tagId }: { todoId: string; tagId: string }) =>
      api.delete<{ success: boolean }>(`/tags/todo/${todoId}/tag/${tagId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    tags: data?.tags ?? [],
    isLoading,
    error,
    createTag: createMutation.mutateAsync,
    updateTag: updateMutation.mutateAsync,
    deleteTag: deleteMutation.mutateAsync,
    addTagToTodo: addTagToTodoMutation.mutateAsync,
    removeTagFromTodo: removeTagFromTodoMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
