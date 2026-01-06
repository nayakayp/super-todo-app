import { useState } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type EisenhowerMatrixProps = {
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  onQuadrantDrop?: (todoId: string, quadrant: Quadrant) => void;
  className?: string;
};

type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';

type QuadrantConfig = {
  id: Quadrant;
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
};

const QUADRANTS: QuadrantConfig[] = [
  {
    id: 'do',
    title: 'Do First',
    subtitle: 'Urgent & Important',
    description: 'Critical tasks requiring immediate attention',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-300',
    icon: '🔥',
  },
  {
    id: 'schedule',
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    description: 'Plan these for later',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: '📅',
  },
  {
    id: 'delegate',
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    description: 'Assign to others if possible',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: '🤝',
  },
  {
    id: 'eliminate',
    title: 'Eliminate',
    subtitle: 'Not Urgent, Not Important',
    description: 'Consider dropping these',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: '🗑️',
  },
];

// Determine quadrant based on priority and due date
function getQuadrant(todo: Todo): Quadrant {
  const isUrgent = todo.due_date
    ? new Date(todo.due_date) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Due within 2 days
    : false;
  const isImportant = todo.priority >= 2; // High or urgent priority

  if (isUrgent && isImportant) return 'do';
  if (!isUrgent && isImportant) return 'schedule';
  if (isUrgent && !isImportant) return 'delegate';
  return 'eliminate';
}

export function EisenhowerMatrix({
  todos,
  onTodoClick,
  onQuadrantDrop,
  className,
}: EisenhowerMatrixProps) {
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null);

  // Filter out completed todos and group by quadrant
  const activeTodos = todos.filter((t) => !t.completed);
  const todosByQuadrant = QUADRANTS.reduce((acc, q) => {
    acc[q.id] = activeTodos.filter((t) => getQuadrant(t) === q.id);
    return acc;
  }, {} as Record<Quadrant, Todo[]>);

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodo(todoId);
    e.dataTransfer.setData('text/plain', todoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, quadrant: Quadrant) => {
    e.preventDefault();
    const todoId = e.dataTransfer.getData('text/plain');
    if (todoId && onQuadrantDrop) {
      onQuadrantDrop(todoId, quadrant);
    }
    setDraggedTodo(null);
  };

  const handleDragEnd = () => {
    setDraggedTodo(null);
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📊</span>
          Eisenhower Matrix
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeTodos.length} active tasks
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Header row */}
        <div className="col-span-2 grid grid-cols-3 gap-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          <div></div>
          <div>Urgent</div>
          <div>Not Urgent</div>
        </div>

        {/* Important row */}
        <div className="flex items-center justify-end pr-2 text-sm font-medium text-gray-500 dark:text-gray-400 -rotate-0">
          Important
        </div>
        <QuadrantBox
          config={QUADRANTS[0]}
          todos={todosByQuadrant.do}
          onTodoClick={onTodoClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={!!draggedTodo}
        />
        <QuadrantBox
          config={QUADRANTS[1]}
          todos={todosByQuadrant.schedule}
          onTodoClick={onTodoClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={!!draggedTodo}
        />

        {/* Not Important row */}
        <div className="flex items-center justify-end pr-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Not Important
        </div>
        <QuadrantBox
          config={QUADRANTS[2]}
          todos={todosByQuadrant.delegate}
          onTodoClick={onTodoClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={!!draggedTodo}
        />
        <QuadrantBox
          config={QUADRANTS[3]}
          todos={todosByQuadrant.eliminate}
          onTodoClick={onTodoClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={!!draggedTodo}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {QUADRANTS.map((q) => (
            <div key={q.id} className="flex items-center gap-1">
              <span>{q.icon}</span>
              <span className={q.textColor}>{q.title}</span>
              <span className="text-gray-400">({todosByQuadrant[q.id].length})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type QuadrantBoxProps = {
  config: QuadrantConfig;
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  onDragStart: (e: React.DragEvent, todoId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, quadrant: Quadrant) => void;
  onDragEnd: () => void;
  isDragging: boolean;
};

function QuadrantBox({
  config,
  todos,
  onTodoClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: QuadrantBoxProps) {
  return (
    <div
      className={cn(
        'min-h-[150px] p-3 rounded-lg border-2 transition-all',
        config.bgColor,
        config.borderColor,
        isDragging && 'border-dashed'
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, config.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <span>{config.icon}</span>
          <span className={cn('text-sm font-medium', config.textColor)}>{config.title}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{todos.length}</span>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">{config.subtitle}</p>

      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {todos.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">No tasks</p>
        ) : (
          todos.slice(0, 5).map((todo) => (
            <div
              key={todo.id}
              draggable
              onDragStart={(e) => onDragStart(e, todo.id)}
              onDragEnd={onDragEnd}
              onClick={() => onTodoClick?.(todo)}
              className={cn(
                'p-2 bg-white dark:bg-gray-700 rounded shadow-sm cursor-pointer hover:shadow transition-shadow',
                'text-xs text-gray-700 dark:text-gray-300 truncate'
              )}
            >
              {todo.title}
            </div>
          ))
        )}
        {todos.length > 5 && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            +{todos.length - 5} more
          </p>
        )}
      </div>
    </div>
  );
}

// Compact widget for sidebar
type EisenhowerWidgetProps = {
  todos: Todo[];
  className?: string;
};

export function EisenhowerWidget({ todos, className }: EisenhowerWidgetProps) {
  const activeTodos = todos.filter((t) => !t.completed);
  const counts = QUADRANTS.reduce((acc, q) => {
    acc[q.id] = activeTodos.filter((t) => getQuadrant(t) === q.id).length;
    return acc;
  }, {} as Record<Quadrant, number>);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <span>📊</span>
        Task Priority
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {QUADRANTS.map((q) => (
          <div
            key={q.id}
            className={cn(
              'p-2 rounded text-center',
              q.bgColor,
              'border',
              q.borderColor
            )}
          >
            <div className="text-lg font-bold">{counts[q.id]}</div>
            <div className={cn('text-[10px]', q.textColor)}>{q.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
