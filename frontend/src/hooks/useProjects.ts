import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Todo } from './useTodos';

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  position: number;
  active_count?: number;
  completed_count?: number;
  total_count?: number;
  created_at: string;
  updated_at: string;
};

type ProjectsResponse = { projects: Project[] };
type ProjectResponse = { project: Project };
type ProjectWithTodosResponse = { project: Project; todos: Todo[] };
type TodoResponse = { todo: Todo };

export function useProjects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get<ProjectsResponse>('/projects');
      return response.projects;
    },
  });

  const getProjectWithTodos = (projectId: string) => {
    return useQuery({
      queryKey: ['projects', projectId],
      queryFn: async () => {
        const response = await api.get<ProjectWithTodosResponse>(`/projects/${projectId}`);
        return response;
      },
      enabled: !!projectId,
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
    }) => {
      const response = await api.post<ProjectResponse>('/projects', data);
      return response.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const response = await api.patch<ProjectResponse>(`/projects/${id}`, data);
      return response.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const addTodoMutation = useMutation({
    mutationFn: async ({ projectId, todoId }: { projectId: string; todoId: string }) => {
      const response = await api.post<TodoResponse>(`/projects/${projectId}/add-todo`, {
        todo_id: todoId,
      });
      return response.todo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const removeTodoMutation = useMutation({
    mutationFn: async (todoId: string) => {
      const response = await api.post<TodoResponse>('/projects/remove-todo', {
        todo_id: todoId,
      });
      return response.todo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    projects,
    isLoading,
    getProjectWithTodos,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    addTodoToProject: addTodoMutation.mutateAsync,
    removeTodoFromProject: removeTodoMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

// Default project colors
export const PROJECT_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
];

// Default project icons
export const PROJECT_ICONS = [
  '📁', '📂', '💼', '🏠', '🏢', '💻', '📱', '🎯',
  '✨', '🚀', '💡', '🔧', '⚙️', '📊', '📈', '💰',
];
