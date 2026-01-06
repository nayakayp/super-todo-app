import { useState, useMemo } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type CalendarViewProps = {
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  className?: string;
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CalendarView({ todos, onTodoClick, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Get todos with due dates organized by date
  const todosByDate = useMemo(() => {
    const map = new Map<string, Todo[]>();
    todos.forEach((todo) => {
      if (todo.due_date) {
        const dateKey = todo.due_date.split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(todo);
      }
    });
    return map;
  }, [todos]);

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill the grid
    const remaining = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const navigateWeek = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta * 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getTodosForDate = (date: Date) => {
    return todosByDate.get(formatDateKey(date)) || [];
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
            >
              Today
            </button>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'px-3 py-1 text-sm',
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-3 py-1 text-sm',
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}
              >
                Week
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => (viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1))}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {viewMode === 'week' && (
              <>
                {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </>
            )}
          </span>
          <button
            onClick={() => (viewMode === 'month' ? navigateMonth(1) : navigateWeek(1))}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayTodos = getTodosForDate(day.date);
            const hasOverdue = dayTodos.some((t) => !t.completed && new Date(t.due_date!) < new Date());

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[80px] p-1 border-b border-r border-gray-200 dark:border-gray-700',
                  !day.isCurrentMonth && 'bg-gray-50 dark:bg-gray-900/50',
                  index % 7 === 6 && 'border-r-0'
                )}
              >
                <div
                  className={cn(
                    'text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                    isToday(day.date)
                      ? 'bg-blue-600 text-white'
                      : !day.isCurrentMonth
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {day.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayTodos.slice(0, 3).map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => onTodoClick?.(todo)}
                      className={cn(
                        'w-full text-left text-[10px] px-1 py-0.5 rounded truncate',
                        todo.completed
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 line-through'
                          : hasOverdue
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      )}
                    >
                      {todo.title}
                    </button>
                  ))}
                  {dayTodos.length > 3 && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
                      +{dayTodos.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Week view
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => {
            const dayTodos = getTodosForDate(day);

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[200px] p-2 border-r border-gray-200 dark:border-gray-700',
                  index === 6 && 'border-r-0',
                  isToday(day) && 'bg-blue-50 dark:bg-blue-900/10'
                )}
              >
                <div
                  className={cn(
                    'text-sm mb-2 text-center',
                    isToday(day)
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayTodos.map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => onTodoClick?.(todo)}
                      className={cn(
                        'w-full text-left text-xs p-1.5 rounded',
                        todo.completed
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      )}
                    >
                      <div className={cn('truncate', todo.completed && 'line-through')}>
                        {todo.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" />
          <span>Overdue</span>
        </div>
      </div>
    </div>
  );
}

// Compact mini calendar for sidebar
type MiniCalendarProps = {
  todos: Todo[];
  onDateSelect?: (date: Date) => void;
  className?: string;
};

export function MiniCalendar({ todos, onDateSelect, className }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const todosByDate = useMemo(() => {
    const map = new Map<string, number>();
    todos.forEach((todo) => {
      if (todo.due_date && !todo.completed) {
        const dateKey = todo.due_date.split('T')[0];
        map.set(dateKey, (map.get(dateKey) || 0) + 1);
      }
    });
    return map;
  }, [todos]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 35 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentDate(newDate);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {MONTHS[currentDate.getMonth()].slice(0, 3)} {currentDate.getFullYear()}
        </span>
        <button
          onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentDate(newDate);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] text-gray-400 dark:text-gray-500 py-1">
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          const count = todosByDate.get(formatDateKey(day.date)) || 0;
          return (
            <button
              key={index}
              onClick={() => onDateSelect?.(day.date)}
              className={cn(
                'text-[10px] w-6 h-6 rounded-full flex items-center justify-center relative',
                isToday(day.date)
                  ? 'bg-blue-600 text-white'
                  : !day.isCurrentMonth
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {day.date.getDate()}
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
