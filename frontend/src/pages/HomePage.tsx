import { useState, useMemo } from 'react';
import { useTodos, Todo } from '../hooks/useTodos';
import { useAuth } from '../hooks/useAuth';
import { EmptyState, TodoListSkeleton, FilterTabs, PrioritySelect, PriorityBadge, Priority, DatePicker, DueDateBadge, ThemeToggle } from '../components/shared';
import { useUIStore } from '../stores/uiStore';

function TodoItem({ todo, onToggle, onDelete }: { todo: Todo; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${todo.completed ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        className="w-5 h-5"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium dark:text-white ${todo.completed ? 'line-through' : ''}`}>{todo.title}</h3>
          <PriorityBadge priority={todo.priority as Priority} />
          <DueDateBadge dueDate={todo.due_date} />
        </div>
        {todo.description && <p className="text-gray-600 dark:text-gray-400 text-sm">{todo.description}</p>}
      </div>
      <button onClick={onDelete} className="text-red-500 hover:text-red-700">
        Delete
      </button>
    </div>
  );
}

export function HomePage() {
  const { user, signOut, isSigningOut } = useAuth();
  const { todos, isLoading, createTodo, updateTodo, deleteTodo, isCreating } = useTodos();
  const filter = useUIStore((state) => state.filter);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(0);
  const [newDueDate, setNewDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [touched, setTouched] = useState<{ title?: boolean }>({});

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

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
      due_date: newDueDate || undefined
    });
    setNewTitle('');
    setNewDescription('');
    setNewPriority(0);
    setNewDueDate('');
    setErrors({});
    setTouched({});
  };

  const handleToggle = async (todo: Todo) => {
    await updateTodo({ id: todo.id, completed: !todo.completed });
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Todo App</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-gray-600 dark:text-gray-300">{user?.email}</span>
            <button onClick={() => signOut()} disabled={isSigningOut} className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleCreate} className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow" noValidate>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="What needs to be done?"
                className={`input w-full ${errors.title && touched.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && touched.title && (
                <p id="title-error" className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            <button type="submit" disabled={isCreating || !!errors.title} className="btn btn-primary self-start">
              {isCreating ? 'Adding...' : 'Add Todo'}
            </button>
          </div>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            className="input mt-2"
          />
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Priority:</label>
              <PrioritySelect value={newPriority} onChange={setNewPriority} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Due date:</label>
              <DatePicker value={newDueDate} onChange={setNewDueDate} />
            </div>
          </div>
        </form>

        {todos.length > 0 && (
          <div className="mb-6 flex justify-center">
            <FilterTabs />
          </div>
        )}

        {isLoading ? (
          <TodoListSkeleton count={3} />
        ) : filteredTodos.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? "No todos yet" : `No ${filter} todos`}
            description={filter === 'all' ? "Get started by adding your first todo above." : `You don't have any ${filter} todos.`}
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => handleToggle(todo)}
                onDelete={() => handleDelete(todo.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
