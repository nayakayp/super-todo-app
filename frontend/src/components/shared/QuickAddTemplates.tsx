import { useState } from 'react';
import { useTemplates, TodoTemplate, DEFAULT_TEMPLATE_PRESETS } from '../../hooks/useTemplates';
import { RecurrencePattern } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';
import { useToast } from './Toast';

type QuickAddTemplatesProps = {
  onTodoCreated?: () => void;
  className?: string;
};

export function QuickAddTemplates({ onTodoCreated, className }: QuickAddTemplatesProps) {
  const { templates, useTemplate, isUsing, createTemplate, deleteTemplate } = useTemplates();
  const toast = useToast();
  const [showManager, setShowManager] = useState(false);

  const handleUseTemplate = async (template: TodoTemplate) => {
    try {
      await useTemplate({ templateId: template.id });
      toast.success(`Created todo from "${template.name}"`);
      onTodoCreated?.();
    } catch {
      toast.error('Failed to create todo from template');
    }
  };

  if (templates.length === 0 && !showManager) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Add</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Create templates for frequently used todos
        </p>
        <button
          onClick={() => setShowManager(true)}
          className="w-full py-2 px-4 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          + Add Templates
        </button>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Add</h3>
        <button
          onClick={() => setShowManager(!showManager)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {showManager ? 'Done' : 'Manage'}
        </button>
      </div>

      {showManager ? (
        <TemplateManager
          templates={templates}
          onAdd={createTemplate}
          onDelete={deleteTemplate}
          onClose={() => setShowManager(false)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templates.slice(0, 6).map((template) => (
            <button
              key={template.id}
              onClick={() => handleUseTemplate(template)}
              disabled={isUsing}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all hover:scale-105',
                'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              )}
              style={{
                backgroundColor: template.color ? `${template.color}15` : undefined,
                borderColor: template.color || undefined,
              }}
            >
              <span className="text-lg">{template.icon || '📋'}</span>
              <span className="truncate text-gray-700 dark:text-gray-300">{template.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type TemplateManagerProps = {
  templates: TodoTemplate[];
  onAdd: (template: {
    name: string;
    title: string;
    icon?: string;
    color?: string;
    priority?: number;
    tags?: string[];
    recurrence_pattern?: RecurrencePattern;
    recurrence_days_of_week?: number[];
  }) => Promise<TodoTemplate>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
};

function TemplateManager({ templates, onAdd, onDelete, onClose }: TemplateManagerProps) {
  const toast = useToast();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('📋');

  const handleAddPreset = async (preset: typeof DEFAULT_TEMPLATE_PRESETS[0]) => {
    try {
      await onAdd(preset);
      toast.success(`Added "${preset.name}" template`);
    } catch {
      toast.error('Failed to add template');
    }
  };

  const handleAddCustom = async () => {
    if (!newName.trim() || !newTitle.trim()) return;

    try {
      await onAdd({
        name: newName.trim(),
        title: newTitle.trim(),
        icon: newIcon,
      });
      setNewName('');
      setNewTitle('');
      setNewIcon('📋');
      setShowNewForm(false);
      toast.success('Template created');
    } catch {
      toast.error('Failed to create template');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await onDelete(id);
      toast.success(`Deleted "${name}" template`);
    } catch {
      toast.error('Failed to delete template');
    }
  };

  // Filter out presets that already exist
  const existingNames = new Set(templates.map((t) => t.name.toLowerCase()));
  const availablePresets = DEFAULT_TEMPLATE_PRESETS.filter(
    (p) => !existingNames.has(p.name.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Existing templates */}
      {templates.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Your Templates</h4>
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span>{template.icon || '📋'}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{template.name}</span>
                  <span className="text-xs text-gray-400">({template.usage_count} uses)</span>
                </div>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset templates to add */}
      {availablePresets.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Add Presets</h4>
          <div className="grid grid-cols-2 gap-2">
            {availablePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleAddPreset(preset)}
                className="flex items-center gap-2 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-600"
              >
                <span>{preset.icon}</span>
                <span className="truncate">{preset.name}</span>
                <span className="ml-auto text-green-500">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom template form */}
      {showNewForm ? (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Icon"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-12 px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Template name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            />
          </div>
          <input
            type="text"
            placeholder="Default todo title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewForm(false)}
              className="flex-1 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustom}
              disabled={!newName.trim() || !newTitle.trim()}
              className="flex-1 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full py-2 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500"
        >
          + Create Custom Template
        </button>
      )}

      <button
        onClick={onClose}
        className="w-full py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        Done
      </button>
    </div>
  );
}
