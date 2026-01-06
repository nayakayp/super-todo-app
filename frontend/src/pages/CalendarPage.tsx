import { Link } from 'react-router-dom';
import { useTodos, Todo } from '../hooks/useTodos';
import { CalendarView, MiniCalendar, LoadingSpinner, ToastContainer, useToast } from '../components/shared';
import { cn } from '../lib/utils';
import { useState } from 'react';

export function CalendarPage() {
  const { todos, isLoading, updateTodo } = useTodos();
  const { toasts, removeToast, showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleTodoClick = (todo: Todo) => {
    if (todo.completed) {
      showToast(`"${todo.title}" is already completed`, 'info');
    } else {
      updateTodo({ id: todo.id, completed: true });
      showToast(`Completed "${todo.title}"`, 'success');
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    showToast(`Selected ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`, 'info');
  };

  const todosWithDueDates = todos.filter(t => t.due_date);
  const upcomingTodos = todos
    .filter(t => t.due_date && !t.completed && new Date(t.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const overdueTodos = todos
    .filter(t => t.due_date && !t.completed && new Date(t.due_date) < new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📅</span>
              Calendar View
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Tasks
            </Link>
            <Link
              to="/stats"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Statistics
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <LoadingSpinner className="mx-auto" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Mini Calendar */}
              <MiniCalendar
                todos={todos}
                onDateSelect={handleDateSelect}
              />

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Overview
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Todos with dates</span>
                    <span className="font-medium text-gray-900 dark:text-white">{todosWithDueDates.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Upcoming</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{upcomingTodos.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Overdue</span>
                    <span className={cn(
                      'font-medium',
                      overdueTodos.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    )}>
                      {overdueTodos.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overdue Todos */}
              {overdueTodos.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                    <span>⚠️</span>
                    Overdue ({overdueTodos.length})
                  </h3>
                  <div className="space-y-2">
                    {overdueTodos.slice(0, 5).map((todo) => (
                      <button
                        key={todo.id}
                        onClick={() => handleTodoClick(todo)}
                        className="w-full text-left text-sm p-2 rounded bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <div className="text-red-700 dark:text-red-300 truncate">{todo.title}</div>
                        <div className="text-xs text-red-500 dark:text-red-400">
                          Due {new Date(todo.due_date!).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Todos */}
              {upcomingTodos.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Coming Up
                  </h3>
                  <div className="space-y-2">
                    {upcomingTodos.map((todo) => (
                      <button
                        key={todo.id}
                        onClick={() => handleTodoClick(todo)}
                        className="w-full text-left text-sm p-2 rounded bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <div className="text-blue-700 dark:text-blue-300 truncate">{todo.title}</div>
                        <div className="text-xs text-blue-500 dark:text-blue-400">
                          {new Date(todo.due_date!).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Calendar */}
            <div className="lg:col-span-3">
              <CalendarView
                todos={todos}
                onTodoClick={handleTodoClick}
              />
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
