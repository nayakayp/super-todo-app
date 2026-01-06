import { useState } from 'react';
import { useTodos, Todo } from '../hooks/useTodos';
import { useAuth } from '../hooks/useAuth';
import { EmptyState, TodoListSkeleton } from '../components/shared';

function TodoItem({ todo, onToggle, onDelete }: { todo: Todo; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow ${todo.completed ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        className="w-5 h-5"
      />
      <div className="flex-1">
        <h3 className={`font-medium ${todo.completed ? 'line-through' : ''}`}>{todo.title}</h3>
        {todo.description && <p className="text-gray-600 text-sm">{todo.description}</p>}
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
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTodo({ title: newTitle, description: newDescription || undefined });
    setNewTitle('');
    setNewDescription('');
  };

  const handleToggle = async (todo: Todo) => {
    await updateTodo({ id: todo.id, completed: !todo.completed });
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Super Todo App</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button onClick={() => signOut()} disabled={isSigningOut} className="text-blue-600 hover:underline">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleCreate} className="mb-8 bg-white p-4 rounded-lg shadow">
          <div className="flex gap-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="input flex-1"
              required
            />
            <button type="submit" disabled={isCreating} className="btn btn-primary">
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
        </form>

        {isLoading ? (
          <TodoListSkeleton count={3} />
        ) : todos.length === 0 ? (
          <EmptyState
            title="No todos yet"
            description="Get started by adding your first todo above."
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-4">
            {todos.map((todo) => (
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
