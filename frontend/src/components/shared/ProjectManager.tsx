import { useState } from 'react';
import { useProjects, Project, PROJECT_COLORS, PROJECT_ICONS } from '../../hooks/useProjects';
import { cn } from '../../lib/utils';
import { useToast } from './Toast';

type ProjectSelectorProps = {
  value: string | null;
  onChange: (projectId: string | null) => void;
  className?: string;
};

export function ProjectSelector({ value, onChange, className }: ProjectSelectorProps) {
  const { projects, isLoading } = useProjects();
  const [isOpen, setIsOpen] = useState(false);

  const selectedProject = projects.find((p) => p.id === value);

  if (isLoading) {
    return (
      <div className="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors',
          selectedProject
            ? 'border-current'
            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        )}
        style={selectedProject ? { color: selectedProject.color || undefined } : undefined}
      >
        <span>{selectedProject?.icon || '📁'}</span>
        <span className="truncate max-w-[100px]">
          {selectedProject?.name || 'No Project'}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700',
                !value && 'bg-gray-100 dark:bg-gray-700'
              )}
            >
              <span className="text-gray-400">📋</span>
              <span className="text-gray-700 dark:text-gray-300">No Project</span>
            </button>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onChange(project.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700',
                  value === project.id && 'bg-gray-100 dark:bg-gray-700'
                )}
              >
                <span>{project.icon || '📁'}</span>
                <span
                  className="flex-1 truncate"
                  style={{ color: project.color || undefined }}
                >
                  {project.name}
                </span>
                {(project.active_count ?? 0) > 0 && (
                  <span className="text-xs text-gray-400">{project.active_count}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type ProjectSidebarProps = {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  className?: string;
};

export function ProjectSidebar({ selectedProjectId, onSelectProject, className }: ProjectSidebarProps) {
  const { projects, createProject, deleteProject, updateProject, isCreating } = useProjects();
  const toast = useToast();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
  const [newIcon, setNewIcon] = useState('📁');

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      await createProject({
        name: newName.trim(),
        color: newColor,
        icon: newIcon,
      });
      setNewName('');
      setShowNewForm(false);
      toast.success('Project created');
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleDelete = async (project: Project) => {
    try {
      await deleteProject(project.id);
      if (selectedProjectId === project.id) {
        onSelectProject(null);
      }
      toast.success(`Deleted "${project.name}"`);
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      await updateProject({ id: project.id, is_archived: !project.is_archived });
      toast.success(project.is_archived ? 'Project restored' : 'Project archived');
    } catch {
      toast.error('Failed to update project');
    }
  };

  const activeProjects = projects.filter((p) => !p.is_archived);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Projects</h3>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {showNewForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {showNewForm && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded space-y-2">
          <div className="flex gap-2">
            <div className="relative">
              <button
                type="button"
                className="w-10 h-10 text-xl rounded flex items-center justify-center border border-gray-300 dark:border-gray-600"
              >
                {newIcon}
              </button>
              <select
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {PROJECT_ICONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={cn(
                  'w-5 h-5 rounded-full',
                  newColor === color && 'ring-2 ring-offset-1 ring-gray-400'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || isCreating}
            className="w-full py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelectProject(null)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors text-left',
            selectedProjectId === null
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <span>📋</span>
          <span className="flex-1">All Todos</span>
        </button>

        {activeProjects.map((project) => (
          <div
            key={project.id}
            className={cn(
              'group flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors',
              selectedProjectId === project.id
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <button
              onClick={() => onSelectProject(project.id)}
              className="flex-1 flex items-center gap-2 text-left"
            >
              <span>{project.icon || '📁'}</span>
              <span
                className="flex-1 truncate"
                style={{ color: project.color || undefined }}
              >
                {project.name}
              </span>
              <span className="text-xs text-gray-400">
                {project.active_count ?? 0}
              </span>
            </button>
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
              <button
                onClick={() => handleArchive(project)}
                className="p-1 text-gray-400 hover:text-yellow-600"
                title="Archive"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(project)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ProjectBadgeProps = {
  project: Project;
  className?: string;
};

export function ProjectBadge({ project, className }: ProjectBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded',
        className
      )}
      style={{
        backgroundColor: project.color ? `${project.color}20` : undefined,
        color: project.color || undefined,
      }}
    >
      <span>{project.icon || '📁'}</span>
      <span className="truncate max-w-[80px]">{project.name}</span>
    </span>
  );
}
