import { useMemo } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type SmartSuggestionsProps = {
  todos: Todo[];
  onSuggestionClick?: (suggestion: Suggestion) => void;
  className?: string;
};

type Suggestion = {
  type: 'overdue' | 'stale' | 'high_priority' | 'almost_due' | 'quick_win' | 'long_running';
  title: string;
  description: string;
  icon: string;
  action: string;
  todos: Todo[];
  priority: number;
};

export function SmartSuggestions({ todos, onSuggestionClick, className }: SmartSuggestionsProps) {
  const suggestions = useMemo(() => {
    const result: Suggestion[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeTodos = todos.filter((t) => !t.completed);

    // Overdue todos
    const overdue = activeTodos.filter((t) => t.due_date && new Date(t.due_date) < today);
    if (overdue.length > 0) {
      result.push({
        type: 'overdue',
        title: 'Overdue Tasks',
        description: `${overdue.length} task${overdue.length > 1 ? 's' : ''} past due date`,
        icon: '⚠️',
        action: 'Review and reschedule',
        todos: overdue,
        priority: 1,
      });
    }

    // Almost due (due tomorrow)
    const almostDue = activeTodos.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return due >= today && due < tomorrow;
    });
    if (almostDue.length > 0) {
      result.push({
        type: 'almost_due',
        title: 'Due Today',
        description: `${almostDue.length} task${almostDue.length > 1 ? 's' : ''} due today`,
        icon: '📅',
        action: 'Focus on these first',
        todos: almostDue,
        priority: 2,
      });
    }

    // High priority uncompleted
    const highPriority = activeTodos.filter((t) => t.priority >= 2);
    if (highPriority.length > 3) {
      result.push({
        type: 'high_priority',
        title: 'Too Many High Priority',
        description: `${highPriority.length} high/critical priority tasks`,
        icon: '🎯',
        action: 'Consider re-prioritizing',
        todos: highPriority,
        priority: 3,
      });
    }

    // Stale todos (not updated in a week)
    const stale = activeTodos.filter((t) => new Date(t.updated_at) < weekAgo);
    if (stale.length > 0) {
      result.push({
        type: 'stale',
        title: 'Stale Tasks',
        description: `${stale.length} task${stale.length > 1 ? 's' : ''} haven't been touched in a week`,
        icon: '🕸️',
        action: 'Review or archive',
        todos: stale,
        priority: 4,
      });
    }

    // Quick wins (low priority, no due date, short title - likely simple)
    const quickWins = activeTodos.filter(
      (t) => t.priority === 0 && !t.due_date && t.title.length < 30
    );
    if (quickWins.length > 0 && quickWins.length <= 5) {
      result.push({
        type: 'quick_win',
        title: 'Quick Wins',
        description: `${quickWins.length} simple task${quickWins.length > 1 ? 's' : ''} to knock out`,
        icon: '⚡',
        action: 'Complete these quickly',
        todos: quickWins,
        priority: 5,
      });
    }

    // Long running (created long ago, still active)
    const longRunning = activeTodos.filter(
      (t) => new Date(t.created_at) < threeDaysAgo && t.priority >= 1
    );
    if (longRunning.length > 5) {
      result.push({
        type: 'long_running',
        title: 'Long Running Tasks',
        description: `${longRunning.length} tasks created over 3 days ago`,
        icon: '🐢',
        action: 'Break down or delegate',
        todos: longRunning.slice(0, 5),
        priority: 6,
      });
    }

    return result.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [todos]);

  if (suggestions.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Insights</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Great job! No issues detected in your task list.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧠</span>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Insights</h3>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick?.(suggestion)}
            className="w-full text-left p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{suggestion.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {suggestion.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.description}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {suggestion.action} →
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Productivity tips based on user behavior
type ProductivityTipsProps = {
  todos: Todo[];
  className?: string;
};

const TIPS = [
  {
    condition: (todos: Todo[]) => todos.filter((t) => t.priority === 0 && !t.completed).length > 10,
    tip: 'Consider using priorities to focus on what matters most.',
    icon: '🎯',
  },
  {
    condition: (todos: Todo[]) => todos.filter((t) => !t.due_date && !t.completed).length > 5,
    tip: 'Adding due dates helps you stay on track.',
    icon: '📅',
  },
  {
    condition: (todos: Todo[]) => todos.filter((t) => !t.description && !t.completed).length > 10,
    tip: 'Add descriptions to remember context later.',
    icon: '📝',
  },
  {
    condition: (todos: Todo[]) => {
      const completed = todos.filter((t) => t.completed).length;
      const total = todos.length;
      return total > 10 && completed / total < 0.3;
    },
    tip: 'Try breaking large tasks into smaller subtasks.',
    icon: '✂️',
  },
  {
    condition: (todos: Todo[]) => todos.filter((t) => t.completed).length > 20,
    tip: 'Consider archiving old completed tasks to keep your list clean.',
    icon: '🗂️',
  },
];

export function ProductivityTips({ todos, className }: ProductivityTipsProps) {
  const relevantTip = useMemo(() => {
    for (const tip of TIPS) {
      if (tip.condition(todos)) {
        return tip;
      }
    }
    return null;
  }, [todos]);

  if (!relevantTip) return null;

  return (
    <div className={cn('bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800', className)}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{relevantTip.icon}</span>
        <p className="text-sm text-purple-800 dark:text-purple-200">{relevantTip.tip}</p>
      </div>
    </div>
  );
}
