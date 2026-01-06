import { useState, useMemo } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type TodoDependency = {
  id: string;
  todo_id: string;
  depends_on_id: string;
};

type DependencyManagerProps = {
  todo: Todo;
  allTodos: Todo[];
  dependencies: TodoDependency[];
  onAddDependency?: (todoId: string, dependsOnId: string) => void;
  onRemoveDependency?: (dependencyId: string) => void;
  className?: string;
};

export function DependencyManager({
  todo,
  allTodos,
  dependencies,
  onAddDependency,
  onRemoveDependency,
  className,
}: DependencyManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get todos this todo depends on (blockers)
  const blockers = useMemo(() => {
    const blockerIds = dependencies
      .filter((d) => d.todo_id === todo.id)
      .map((d) => d.depends_on_id);
    return allTodos.filter((t) => blockerIds.includes(t.id));
  }, [dependencies, todo.id, allTodos]);

  // Get todos that depend on this todo (blocking)
  const blocking = useMemo(() => {
    const blockingIds = dependencies
      .filter((d) => d.depends_on_id === todo.id)
      .map((d) => d.todo_id);
    return allTodos.filter((t) => blockingIds.includes(t.id));
  }, [dependencies, todo.id, allTodos]);

  // Get available todos to add as dependencies
  const availableTodos = useMemo(() => {
    const existingBlockerIds = new Set(blockers.map((b) => b.id));
    return allTodos
      .filter(
        (t) =>
          t.id !== todo.id && // Not self
          !existingBlockerIds.has(t.id) && // Not already a blocker
          !t.completed // Not completed
      )
      .filter((t) =>
        searchQuery
          ? t.title.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      );
  }, [allTodos, todo.id, blockers, searchQuery]);

  // Check if all blockers are completed
  const isBlocked = blockers.some((b) => !b.completed);
  const unblockedCount = blockers.filter((b) => b.completed).length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Status indicator */}
      {blockers.length > 0 && (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            isBlocked
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          )}
        >
          <span>{isBlocked ? '🚫' : '✅'}</span>
          <span>
            {isBlocked
              ? `Blocked by ${blockers.length - unblockedCount} task${blockers.length - unblockedCount > 1 ? 's' : ''}`
              : 'All blockers resolved'}
          </span>
        </div>
      )}

      {/* Blockers (depends on) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Depends On ({blockers.length})
          </h4>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add blocker
          </button>
        </div>
        {blockers.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            No dependencies
          </p>
        ) : (
          <div className="space-y-1">
            {blockers.map((blocker) => (
              <div
                key={blocker.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded text-sm',
                  blocker.completed
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{blocker.completed ? '✅' : '⏳'}</span>
                  <span
                    className={cn(
                      'truncate',
                      blocker.completed && 'line-through text-gray-500'
                    )}
                  >
                    {blocker.title}
                  </span>
                </div>
                {onRemoveDependency && (
                  <button
                    onClick={() => {
                      const dep = dependencies.find(
                        (d) => d.todo_id === todo.id && d.depends_on_id === blocker.id
                      );
                      if (dep) onRemoveDependency(dep.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocking (other todos depend on this) */}
      {blocking.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Blocking ({blocking.length})
          </h4>
          <div className="space-y-1">
            {blocking.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm"
              >
                <span>⏸️</span>
                <span className="truncate">{blocked.title}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Complete this task to unblock others
          </p>
        </div>
      )}

      {/* Add dependency modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Add Dependency
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Select a task that must be completed before "{todo.title}"
            </p>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {availableTodos.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No available tasks to add
                </p>
              ) : (
                availableTodos.slice(0, 10).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onAddDependency?.(todo.id, t.id);
                      setShowAddModal(false);
                      setSearchQuery('');
                    }}
                    className="w-full p-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                  >
                    <span className="text-gray-400">+</span>
                    <span className="truncate text-gray-900 dark:text-white">
                      {t.title}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact blocker badge for todo items
type BlockerBadgeProps = {
  blockerCount: number;
  isBlocked: boolean;
};

export function BlockerBadge({ blockerCount, isBlocked }: BlockerBadgeProps) {
  if (blockerCount === 0) return null;

  return (
    <span
      className={cn(
        'px-1.5 py-0.5 text-[10px] rounded-full',
        isBlocked
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      )}
      title={isBlocked ? `Blocked by ${blockerCount} task(s)` : 'All blockers resolved'}
    >
      {isBlocked ? '🚫' : '✅'} {blockerCount}
    </span>
  );
}

// Dependency graph visualization (simplified)
type DependencyGraphProps = {
  todos: Todo[];
  dependencies: TodoDependency[];
  className?: string;
};

export function DependencyGraph({ todos, dependencies, className }: DependencyGraphProps) {
  // Group todos by their dependency depth
  const layers = useMemo(() => {
    const todoMap = new Map(todos.map((t) => [t.id, t]));
    const depMap = new Map<string, Set<string>>();

    dependencies.forEach((d) => {
      if (!depMap.has(d.todo_id)) {
        depMap.set(d.todo_id, new Set());
      }
      depMap.get(d.todo_id)!.add(d.depends_on_id);
    });

    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 0; // Cycle detection
      visited.add(id);

      const deps = depMap.get(id);
      if (!deps || deps.size === 0) return 0;

      return 1 + Math.max(...Array.from(deps).map((d) => getDepth(d, visited)));
    };

    const todosWithDepth = todos
      .filter((t) => !t.completed)
      .map((t) => ({ todo: t, depth: getDepth(t.id) }));

    const maxDepth = Math.max(...todosWithDepth.map((t) => t.depth), 0);
    const layers: Todo[][] = [];

    for (let d = maxDepth; d >= 0; d--) {
      layers.push(todosWithDepth.filter((t) => t.depth === d).map((t) => t.todo));
    }

    return layers.filter((l) => l.length > 0);
  }, [todos, dependencies]);

  if (dependencies.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500 dark:text-gray-400', className)}>
        <p>No dependencies defined</p>
        <p className="text-xs mt-1">Add dependencies to see the task flow</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Task Dependency Flow
      </h4>
      <div className="space-y-3">
        {layers.map((layer, layerIndex) => (
          <div key={layerIndex}>
            <div className="text-xs text-gray-400 mb-1">
              {layerIndex === 0 ? 'Start here' : layerIndex === layers.length - 1 ? 'Final tasks' : `Level ${layerIndex + 1}`}
            </div>
            <div className="flex flex-wrap gap-2">
              {layer.map((todo) => (
                <div
                  key={todo.id}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs truncate max-w-[150px]"
                  title={todo.title}
                >
                  {todo.title}
                </div>
              ))}
            </div>
            {layerIndex < layers.length - 1 && (
              <div className="text-center text-gray-300 dark:text-gray-600 my-1">↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
