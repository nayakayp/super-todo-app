import { useState, useMemo, useRef, useCallback } from 'react';
import { useTodos, Todo } from '../hooks/useTodos';
import { useAuth } from '../hooks/useAuth';
import {
  EmptyState,
  TodoListSkeleton,
  FilterTabs,
  PrioritySelect,
  Priority,
  DatePicker,
  ThemeToggle,
  SortSelect,
  SortOption,
  SortDirection,
  BulkActions,
  ProgressStats,
  useKeyboardShortcuts,
  KeyboardShortcutsModal,
} from '../components/shared';
import { TodoSearch, TodoItem } from '../components/todos';
import { useUIStore } from '../stores/uiStore';

export function HomePage() {
  const { user, signOut, isSigningOut } = useAuth();
  const { todos, isLoading, createTodo, updateTodo, deleteTodo, isCreating } = useTodos();
  const filter = useUIStore((state) => state.filter);
  const setFilter = useUIStore((state) => state.setFilter);
  const searchQuery = useUIStore((state) => state.searchQuery);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(0);
  const [newDueDate, setNewDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [touched, setTouched] = useState<{ title?: boolean }>({});
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    onNewTodo: () => {
      setIsFormExpanded(true);
      titleInputRef.current?.focus();
    },
    onFocusSearch: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onFilterAll: () => setFilter('all'),
    onFilterCompleted: () => setFilter('completed'),
    onFilterActive: () => setFilter('active'),
    onToggleSelectMode: () => {
      setSelectMode((prev) => !prev);
      setSelectedIds(new Set());
    },
    onToggleDarkMode: () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    },
  });

  // Filtered and sorted todos
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    switch (filter) {
      case 'active':
        result = result.filter((todo) => !todo.completed);
        break;
      case 'completed':
        result = result.filter((todo) => todo.completed);
        break;
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'priority':
          comparison = b.priority - a.priority;
          break;
        case 'dueDate':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [todos, filter, searchQuery, sortBy, sortDirection]);

  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) return 'Title is required';
    if (value.trim().length < 2) return 'Title must be at least 2 characters';
    if (value.trim().length > 200) return 'Title must be less than 200 characters';
    return undefined;
  };

  const handleTitleChange = (value: string) => {
    setNewTitle(value);
    if (touched.title) {
      setErrors({ ...errors, title: validateTitle(value) });
    }
  };

  const handleTitleBlur = () => {
    setTouched({ ...touched, title: true });
    setErrors({ ...errors, title: validateTitle(newTitle) });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleError = validateTitle(newTitle);
    if (titleError) {
      setErrors({ title: titleError });
      setTouched({ title: true });
      return;
    }
    await createTodo({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      due_date: newDueDate || undefined,
    });
    setNewTitle('');
    setNewDescription('');
    setNewPriority(0);
    setNewDueDate('');
    setErrors({});
    setTouched({});
    setIsFormExpanded(false);
  };

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Todo>) => {
      const cleanUpdates: Record<string, unknown> = { id };
      if (updates.title !== undefined) cleanUpdates.title = updates.title;
      if (updates.description !== undefined) cleanUpdates.description = updates.description || undefined;
      if (updates.completed !== undefined) cleanUpdates.completed = updates.completed;
      if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
      if (updates.due_date !== undefined) cleanUpdates.due_date = updates.due_date || undefined;
      await updateTodo(cleanUpdates as { id: string; title?: string; description?: string; completed?: boolean; priority?: number; due_date?: string });
    },
    [updateTodo]
  );

  const handleToggle = useCallback(
    async (todo: Todo) => {
      await updateTodo({ id: todo.id, completed: !todo.completed });
    },
    [updateTodo]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTodo(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [deleteTodo]
  );

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectMode(true);
    setSelectedIds(new Set(filteredTodos.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => deleteTodo(id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkComplete = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => updateTodo({ id, completed: true })));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkUncomplete = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => updateTodo({ id, completed: false })));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Todo App</h1>
            <span className="hidden sm:inline px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              Pro
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHelp(true)}
              className="hidden sm:block text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Keyboard shortcuts (Shift+?)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <ThemeToggle />
            <span className="hidden sm:block text-gray-600 dark:text-gray-300 text-sm">{user?.email}</span>
            <button
              onClick={() => signOut()}
              disabled={isSigningOut}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with stats */}
          <aside className="lg:col-span-1 space-y-6">
            <ProgressStats todos={todos} />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <li>Press <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">Shift+?</kbd> for shortcuts</li>
                <li>Click a todo title to edit</li>
                <li>Use filters to find todos fast</li>
                <li>Set priorities and due dates</li>
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Create form */}
            <form
              onSubmit={handleCreate}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              <div className="p-4">
                <div className="flex gap-3">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={newTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onBlur={handleTitleBlur}
                    onFocus={() => setIsFormExpanded(true)}
                    placeholder="What needs to be done? (Ctrl+N)"
                    className={`flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.title && touched.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isCreating || !!errors.title}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isCreating ? 'Adding...' : 'Add'}
                  </button>
                </div>
                {errors.title && touched.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
              {isFormExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                    rows={2}
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-300">Priority:</label>
                      <PrioritySelect value={newPriority} onChange={setNewPriority} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-300">Due:</label>
                      <DatePicker value={newDueDate} onChange={setNewDueDate} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFormExpanded(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-auto"
                    >
                      Collapse
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Filters and controls */}
            {todos.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <TodoSearch className="w-full sm:w-48" />
                  <FilterTabs />
                </div>
                <div className="flex items-center gap-3">
                  <SortSelect
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSortChange={(by, dir) => {
                      setSortBy(by);
                      setSortDirection(dir);
                    }}
                  />
                  <button
                    onClick={() => {
                      setSelectMode(!selectMode);
                      setSelectedIds(new Set());
                    }}
                    className={`px-3 py-1.5 text-sm rounded-md border ${
                      selectMode
                        ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {selectMode ? 'Cancel Select' : 'Select'}
                  </button>
                </div>
              </div>
            )}

            {/* Bulk actions */}
            {selectMode && filteredTodos.length > 0 && (
              <BulkActions
                selectedCount={selectedIds.size}
                totalCount={filteredTodos.length}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onDeleteSelected={handleBulkDelete}
                onCompleteSelected={handleBulkComplete}
                onUncompleteSelected={handleBulkUncomplete}
              />
            )}

            {/* Todo list */}
            {isLoading ? (
              <TodoListSkeleton count={5} />
            ) : filteredTodos.length === 0 ? (
              <EmptyState
                title={filter === 'all' ? 'No todos yet' : `No ${filter} todos`}
                description={
                  filter === 'all'
                    ? 'Get started by adding your first todo above.'
                    : `You don't have any ${filter} todos.`
                }
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={() => handleToggle(todo)}
                    onDelete={() => handleDelete(todo.id)}
                    onUpdate={(updates) => handleUpdate(todo.id, updates)}
                    isSelected={selectedIds.has(todo.id)}
                    onSelect={(selected) => handleSelect(todo.id, selected)}
                    showCheckbox={selectMode}
                  />
                ))}
              </div>
            )}

            {/* Footer stats */}
            {todos.length > 0 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {filteredTodos.length} of {todos.length} todos shown
                {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
