import { useState, useMemo, useCallback } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';
import { Priority } from './PrioritySelect';

type AdvancedSearchProps = {
  todos: Todo[];
  onResultsChange: (filtered: Todo[]) => void;
  className?: string;
};

type SearchFilters = {
  query: string;
  status: 'all' | 'active' | 'completed';
  priority: Priority | 'any';
  hasDueDate: 'any' | 'yes' | 'no' | 'overdue' | 'upcoming';
  hasDescription: 'any' | 'yes' | 'no';
  dateRange: { from: string; to: string } | null;
  tags: string[];
  projectId: string | null;
};

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  status: 'all',
  priority: 'any',
  hasDueDate: 'any',
  hasDescription: 'any',
  dateRange: null,
  tags: [],
  projectId: null,
};

export function AdvancedSearch({ todos, onResultsChange, className }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get unique tags from todos
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    todos.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag.name)));
    return Array.from(tagSet).sort();
  }, [todos]);

  // Apply filters
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // Query search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (filters.status === 'completed') {
      result = result.filter((t) => t.completed);
    }

    // Priority filter
    if (filters.priority !== 'any') {
      result = result.filter((t) => t.priority === filters.priority);
    }

    // Due date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (filters.hasDueDate === 'yes') {
      result = result.filter((t) => t.due_date);
    } else if (filters.hasDueDate === 'no') {
      result = result.filter((t) => !t.due_date);
    } else if (filters.hasDueDate === 'overdue') {
      result = result.filter((t) => t.due_date && new Date(t.due_date) < today && !t.completed);
    } else if (filters.hasDueDate === 'upcoming') {
      result = result.filter((t) => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        return due >= today && due <= weekFromNow;
      });
    }

    // Description filter
    if (filters.hasDescription === 'yes') {
      result = result.filter((t) => t.description && t.description.trim().length > 0);
    } else if (filters.hasDescription === 'no') {
      result = result.filter((t) => !t.description || t.description.trim().length === 0);
    }

    // Date range filter
    if (filters.dateRange) {
      const from = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
      const to = filters.dateRange.to ? new Date(filters.dateRange.to) : null;
      result = result.filter((t) => {
        const created = new Date(t.created_at);
        if (from && created < from) return false;
        if (to && created > to) return false;
        return true;
      });
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter((t) =>
        filters.tags.every((tag) => t.tags?.some((tt) => tt.name === tag))
      );
    }

    // Project filter
    if (filters.projectId) {
      result = result.filter((t) => t.project_id === filters.projectId);
    }

    return result;
  }, [todos, filters]);

  // Update parent when filtered results change
  const updateResults = useCallback(() => {
    onResultsChange(filteredTodos);
  }, [filteredTodos, onResultsChange]);

  // Effect to update results
  useMemo(() => {
    updateResults();
  }, [filteredTodos]);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.priority !== 'any') count++;
    if (filters.hasDueDate !== 'any') count++;
    if (filters.hasDescription !== 'any') count++;
    if (filters.dateRange) count++;
    if (filters.tags.length > 0) count++;
    if (filters.projectId) count++;
    return count;
  }, [filters]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            placeholder="Search todos..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'px-3 py-2 text-sm rounded-lg border transition-colors flex items-center gap-1',
            showAdvanced || activeFiltersCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h4>
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset all
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value as 'all' | 'active' | 'completed')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value === 'any' ? 'any' : parseInt(e.target.value) as Priority)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="any">Any</option>
                <option value="3">Critical</option>
                <option value="2">High</option>
                <option value="1">Medium</option>
                <option value="0">Low</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
              <select
                value={filters.hasDueDate}
                onChange={(e) => updateFilter('hasDueDate', e.target.value as SearchFilters['hasDueDate'])}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="any">Any</option>
                <option value="yes">Has due date</option>
                <option value="no">No due date</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Upcoming (7 days)</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <select
                value={filters.hasDescription}
                onChange={(e) => updateFilter('hasDescription', e.target.value as 'any' | 'yes' | 'no')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="any">Any</option>
                <option value="yes">Has description</option>
                <option value="no">No description</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = filters.tags.includes(tag)
                        ? filters.tags.filter((t) => t !== tag)
                        : [...filters.tags, tag];
                      updateFilter('tags', newTags);
                    }}
                    className={cn(
                      'px-2 py-1 text-xs rounded-full border transition-colors',
                      filters.tags.includes(tag)
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTodos.length} of {todos.length} todos match
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick search command palette style
type QuickSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  todos: Todo[];
  onTodoSelect: (todo: Todo) => void;
};

export function QuickSearchModal({ isOpen, onClose, todos, onTodoSelect }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return todos.slice(0, 10);
    const q = query.toLowerCase();
    return todos
      .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [todos, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search todos..."
            autoFocus
            className="flex-1 px-3 py-4 bg-transparent text-gray-900 dark:text-white outline-none"
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found
            </div>
          ) : (
            results.map((todo) => (
              <button
                key={todo.id}
                onClick={() => {
                  onTodoSelect(todo);
                  onClose();
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <span className={cn('w-4 h-4 rounded border', todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600')} />
                <div className="flex-1 min-w-0">
                  <div className={cn('text-sm text-gray-900 dark:text-white truncate', todo.completed && 'line-through opacity-60')}>
                    {todo.title}
                  </div>
                  {todo.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {todo.description}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
