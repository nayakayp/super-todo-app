import { useState, useRef, useEffect } from 'react';
import { Todo } from '../../hooks/useTodos';
import { PrioritySelect, PriorityBadge, Priority, DatePicker, DueDateBadge, TagBadge, RecurrenceBadge, TimeTracker, TimeEntryList } from '../shared';
import { SubtaskList } from './SubtaskList';
import { cn } from '../../lib/utils';
import { useFocusStore } from '../../stores/focusStore';
import { formatDuration } from '../../hooks/useTimeEntries';

type TodoItemProps = {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Todo>) => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  showCheckbox?: boolean;
};

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onUpdate,
  onDuplicate,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editPriority, setEditPriority] = useState<Priority>(todo.priority as Priority);
  const [editDueDate, setEditDueDate] = useState(todo.due_date || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showTimeTracking, setShowTimeTracking] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { isActive, focusedTodoId, startTimer } = useFocusStore();
  const isFocused = focusedTodoId === todo.id;

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim().length < 2) return;
    onUpdate({
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      priority: editPriority,
      due_date: editDueDate || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditPriority(todo.priority as Priority);
    setEditDueDate(todo.due_date || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border-2 border-blue-500">
        <input
          ref={titleInputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
          placeholder="Todo title"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2 resize-none"
          placeholder="Description (optional)"
          rows={2}
        />
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Priority:</label>
            <PrioritySelect value={editPriority} onChange={setEditPriority} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Due:</label>
            <DatePicker value={editDueDate} onChange={setEditDueDate} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={editTitle.trim().length < 2}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group p-4 bg-white dark:bg-gray-800 rounded-lg shadow transition-all',
        todo.completed && 'opacity-60',
        isSelected && 'ring-2 ring-blue-500',
        isFocused && 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20'
      )}
    >
      <div className="flex items-start gap-3">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300"
          />
        )}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={onToggle}
          className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                'font-medium dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400',
                todo.completed && 'line-through'
              )}
              onClick={() => setIsEditing(true)}
              title="Click to edit"
            >
              {todo.title}
            </h3>
            <PriorityBadge priority={todo.priority as Priority} />
            <DueDateBadge dueDate={todo.due_date} />
            <RecurrenceBadge pattern={todo.recurrence_pattern} />
          </div>
          {todo.tags && todo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {todo.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
          {todo.description && (
            <p
              className={cn(
                'text-gray-600 dark:text-gray-400 text-sm mt-1',
                !isExpanded && todo.description.length > 100 && 'line-clamp-2'
              )}
            >
              {todo.description}
              {todo.description.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isExpanded ? 'less' : 'more'}
                </button>
              )}
            </p>
          )}
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2 flex-wrap">
            <span>Created {new Date(todo.created_at).toLocaleDateString()}</span>
            {(todo.total_time_spent ?? 0) > 0 && (
              <span className="text-purple-600 dark:text-purple-400">
                {formatDuration(todo.total_time_spent!)} tracked
              </span>
            )}
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {showSubtasks ? 'Hide' : 'Show'} subtasks
            </button>
            <button
              onClick={() => setShowTimeTracking(!showTimeTracking)}
              className="text-purple-500 hover:text-purple-600 dark:hover:text-purple-400"
            >
              {showTimeTracking ? 'Hide' : 'Show'} time tracking
            </button>
          </div>
          {showSubtasks && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <SubtaskList todoId={todo.id} />
            </div>
          )}
          {showTimeTracking && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <TimeTracker
                todoId={todo.id}
                todoTitle={todo.title}
                totalTimeSpent={todo.total_time_spent ?? 0}
              />
              <TimeEntryList todoId={todo.id} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!todo.completed && (
            <button
              onClick={() => startTimer(todo.id)}
              disabled={isActive}
              className={cn(
                'p-1.5 rounded',
                isFocused
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400',
                isActive && !isFocused && 'opacity-50 cursor-not-allowed'
              )}
              title={isFocused ? 'Currently focusing' : isActive ? 'Stop current focus first' : 'Start focus timer'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded"
              title="Duplicate"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
