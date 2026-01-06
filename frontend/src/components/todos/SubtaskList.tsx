import { useState, useRef, useEffect } from 'react';
import { useSubtasks, Subtask } from '../../hooks/useSubtasks';
import { cn } from '../../lib/utils';

type SubtaskListProps = {
  todoId: string;
  className?: string;
};

export function SubtaskList({ todoId, className }: SubtaskListProps) {
  const { subtasks, isLoading, createSubtask, updateSubtask, deleteSubtask, toggleAll, isCreating } =
    useSubtasks(todoId);
  const [newSubtask, setNewSubtask] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = subtasks.filter((s) => s.completed).length;
  const allCompleted = subtasks.length > 0 && completedCount === subtasks.length;
  const noneCompleted = completedCount === 0;

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    await createSubtask({ todoId, title: newSubtask.trim() });
    setNewSubtask('');
    inputRef.current?.focus();
  };

  const handleToggle = async (subtask: Subtask) => {
    await updateSubtask({ id: subtask.id, completed: !subtask.completed });
  };

  const handleDelete = async (id: string) => {
    await deleteSubtask(id);
  };

  const handleToggleAll = async () => {
    await toggleAll({ todoId, completed: !allCompleted });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress indicator */}
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%` }}
            />
          </div>
          <span>
            {completedCount}/{subtasks.length}
          </span>
          {subtasks.length > 1 && (
            <button
              onClick={handleToggleAll}
              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
              title={allCompleted ? 'Uncheck all' : 'Check all'}
            >
              {allCompleted ? 'Uncheck all' : noneCompleted ? 'Check all' : 'Toggle all'}
            </button>
          )}
        </div>
      )}

      {/* Subtasks list */}
      <ul className="space-y-1">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={() => handleToggle(subtask)}
            onDelete={() => handleDelete(subtask.id)}
            onUpdate={(updates) => updateSubtask({ id: subtask.id, ...updates })}
          />
        ))}
      </ul>

      {/* Add new subtask form */}
      <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Add a subtask..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
          disabled={isCreating}
        />
        <button
          type="submit"
          disabled={isCreating || !newSubtask.trim()}
          className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}

type SubtaskItemProps = {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: { title?: string }) => void;
};

function SubtaskItem({ subtask, onToggle, onDelete, onUpdate }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== subtask.title) {
      onUpdate({ title: editTitle.trim() });
    } else {
      setEditTitle(subtask.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <li className="group flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
      />
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 px-1 py-0.5 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      ) : (
        <span
          className={cn(
            'flex-1 text-sm cursor-pointer',
            subtask.completed && 'line-through text-gray-400 dark:text-gray-500'
          )}
          onClick={() => setIsEditing(true)}
          title="Click to edit"
        >
          {subtask.title}
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
        title="Delete"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}
