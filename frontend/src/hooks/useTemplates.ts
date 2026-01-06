import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Todo, RecurrencePattern } from './useTodos';

export type TodoTemplate = {
  id: string;
  user_id: string;
  name: string;
  title: string;
  description: string | null;
  priority: number;
  tags: string[] | null;
  default_due_days: number | null;
  recurrence_pattern: RecurrencePattern | null;
  recurrence_interval: number | null;
  recurrence_days_of_week: number[] | null;
  icon: string | null;
  color: string | null;
  usage_count: number;
  position: number;
  created_at: string;
  updated_at: string;
};

type TemplatesResponse = { templates: TodoTemplate[] };
type TemplateResponse = { template: TodoTemplate };
type UseTemplateResponse = { todo: Todo };

export function useTemplates() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get<TemplatesResponse>('/templates');
      return response.templates;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      title: string;
      description?: string;
      priority?: number;
      tags?: string[];
      default_due_days?: number;
      recurrence_pattern?: RecurrencePattern;
      recurrence_interval?: number;
      recurrence_days_of_week?: number[];
      icon?: string;
      color?: string;
    }) => {
      const response = await api.post<TemplateResponse>('/templates', data);
      return response.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Omit<TodoTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const response = await api.patch<TemplateResponse>(`/templates/${id}`, data);
      return response.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const useMutation2 = useMutation({
    mutationFn: async ({ templateId, title_override, description_override }: {
      templateId: string;
      title_override?: string;
      description_override?: string;
    }) => {
      const response = await api.post<UseTemplateResponse>(`/templates/${templateId}/use`, {
        title_override,
        description_override,
      });
      return response.todo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] }); // Update usage count
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    useTemplate: useMutation2.mutateAsync,
    isCreating: createMutation.isPending,
    isUsing: useMutation2.isPending,
  };
}

// Default templates that can be added by users
export const DEFAULT_TEMPLATE_PRESETS = [
  {
    name: 'Daily Task',
    title: 'Daily Task',
    icon: '📅',
    color: '#3B82F6',
    recurrence_pattern: 'daily' as RecurrencePattern,
    priority: 1,
  },
  {
    name: 'Weekly Review',
    title: 'Weekly Review',
    icon: '📊',
    color: '#8B5CF6',
    recurrence_pattern: 'weekly' as RecurrencePattern,
    recurrence_days_of_week: [5], // Friday
    priority: 2,
  },
  {
    name: 'Bug Fix',
    title: 'Fix: ',
    icon: '🐛',
    color: '#EF4444',
    priority: 3,
    tags: ['bug'],
  },
  {
    name: 'Feature',
    title: 'Feature: ',
    icon: '✨',
    color: '#10B981',
    priority: 2,
    tags: ['feature'],
  },
  {
    name: 'Meeting Notes',
    title: 'Meeting Notes: ',
    icon: '📝',
    color: '#F59E0B',
    priority: 1,
  },
  {
    name: 'Research',
    title: 'Research: ',
    icon: '🔍',
    color: '#6366F1',
    priority: 1,
    tags: ['research'],
  },
];
