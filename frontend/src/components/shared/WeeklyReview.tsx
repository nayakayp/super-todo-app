import { useState, useMemo } from 'react';
import { Todo } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type WeeklyReviewProps = {
  todos: Todo[];
  className?: string;
};

type ReviewSection = 'accomplishments' | 'challenges' | 'insights' | 'goals';

const REVIEW_PROMPTS: Record<ReviewSection, { title: string; icon: string; questions: string[] }> = {
  accomplishments: {
    title: 'Accomplishments',
    icon: '🏆',
    questions: [
      'What tasks did you complete this week?',
      'What are you most proud of?',
      'What progress did you make on big projects?',
    ],
  },
  challenges: {
    title: 'Challenges',
    icon: '🧗',
    questions: [
      'What was difficult this week?',
      'What tasks are taking longer than expected?',
      'What obstacles are blocking your progress?',
    ],
  },
  insights: {
    title: 'Insights',
    icon: '💡',
    questions: [
      'What did you learn this week?',
      'What patterns do you notice in your work?',
      'What could you do differently?',
    ],
  },
  goals: {
    title: 'Next Week Goals',
    icon: '🎯',
    questions: [
      'What are your top 3 priorities for next week?',
      'What would make next week successful?',
      'What habits do you want to build?',
    ],
  },
};

export function WeeklyReview({ todos, className }: WeeklyReviewProps) {
  const [activeSection, setActiveSection] = useState<ReviewSection>('accomplishments');
  const [notes, setNotes] = useState<Record<ReviewSection, string>>({
    accomplishments: '',
    challenges: '',
    insights: '',
    goals: '',
  });
  const [showPrompts, setShowPrompts] = useState(true);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedThisWeek = todos.filter((t) => {
      if (!t.completed) return false;
      const updated = new Date(t.updated_at);
      return updated >= weekAgo;
    });

    const createdThisWeek = todos.filter((t) => {
      const created = new Date(t.created_at);
      return created >= weekAgo;
    });

    const overdueCount = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return new Date(t.due_date) < today;
    }).length;

    // Group completed by priority
    const completedByPriority = {
      high: completedThisWeek.filter((t) => t.priority >= 2).length,
      medium: completedThisWeek.filter((t) => t.priority === 1).length,
      low: completedThisWeek.filter((t) => t.priority === 0).length,
    };

    // Calculate productivity score (0-100)
    const productivityScore = createdThisWeek.length > 0
      ? Math.min(100, Math.round((completedThisWeek.length / createdThisWeek.length) * 100))
      : 0;

    return {
      completedCount: completedThisWeek.length,
      createdCount: createdThisWeek.length,
      overdueCount,
      completedByPriority,
      productivityScore,
      topCompleted: completedThisWeek.slice(0, 5),
    };
  }, [todos]);

  const handleNoteChange = (section: ReviewSection, value: string) => {
    setNotes((prev) => ({ ...prev, [section]: value }));
  };

  const exportReview = () => {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let content = `# Weekly Review - ${date}\n\n`;
    content += `## Summary\n`;
    content += `- Completed: ${weeklyStats.completedCount} tasks\n`;
    content += `- Created: ${weeklyStats.createdCount} tasks\n`;
    content += `- Productivity Score: ${weeklyStats.productivityScore}%\n\n`;

    Object.entries(REVIEW_PROMPTS).forEach(([key, section]) => {
      content += `## ${section.icon} ${section.title}\n\n`;
      if (notes[key as ReviewSection]) {
        content += notes[key as ReviewSection] + '\n\n';
      } else {
        content += '_No notes_\n\n';
      }
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-review-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📝</span>
            Weekly Review
          </h2>
          <button
            onClick={exportReview}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {weeklyStats.completedCount}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {weeklyStats.createdCount}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Created</div>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {weeklyStats.overdueCount}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Overdue</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {weeklyStats.productivityScore}%
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Score</div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(Object.keys(REVIEW_PROMPTS) as ReviewSection[]).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              'flex-1 py-2 px-3 text-sm font-medium transition-colors',
              activeSection === section
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <span className="mr-1">{REVIEW_PROMPTS[section].icon}</span>
            <span className="hidden sm:inline">{REVIEW_PROMPTS[section].title}</span>
          </button>
        ))}
      </div>

      {/* Active Section Content */}
      <div className="p-4">
        {showPrompts && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reflection Prompts
              </h4>
              <button
                onClick={() => setShowPrompts(false)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Hide
              </button>
            </div>
            <ul className="space-y-1">
              {REVIEW_PROMPTS[activeSection].questions.map((q, i) => (
                <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!showPrompts && (
          <button
            onClick={() => setShowPrompts(true)}
            className="mb-4 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Show prompts
          </button>
        )}

        {/* Completed Tasks (for accomplishments section) */}
        {activeSection === 'accomplishments' && weeklyStats.topCompleted.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recently Completed
            </h4>
            <div className="space-y-1">
              {weeklyStats.topCompleted.map((todo) => (
                <div
                  key={todo.id}
                  className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded flex items-center gap-2"
                >
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300 truncate">{todo.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes textarea */}
        <textarea
          value={notes[activeSection]}
          onChange={(e) => handleNoteChange(activeSection, e.target.value)}
          placeholder={`Write your ${REVIEW_PROMPTS[activeSection].title.toLowerCase()} notes here...`}
          className="w-full h-40 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Character count */}
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-right">
          {notes[activeSection].length} characters
        </div>
      </div>
    </div>
  );
}

// Compact widget for sidebar
type WeeklyReviewWidgetProps = {
  todos: Todo[];
  onOpenReview?: () => void;
  className?: string;
};

export function WeeklyReviewWidget({ todos, onOpenReview, className }: WeeklyReviewWidgetProps) {
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedThisWeek = todos.filter((t) => {
      if (!t.completed) return false;
      const updated = new Date(t.updated_at);
      return updated >= weekAgo;
    }).length;

    const createdThisWeek = todos.filter((t) => {
      const created = new Date(t.created_at);
      return created >= weekAgo;
    }).length;

    return { completedThisWeek, createdThisWeek };
  }, [todos]);

  // Check if it's Sunday (typical review day)
  const isSunday = new Date().getDay() === 0;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span>📝</span>
          Weekly Review
        </h3>
        {isSunday && (
          <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
            Review Day!
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {weeklyStats.completedThisWeek}
          </div>
          <div className="text-[10px] text-gray-500">Completed</div>
        </div>
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {weeklyStats.createdThisWeek}
          </div>
          <div className="text-[10px] text-gray-500">Created</div>
        </div>
      </div>
      {onOpenReview && (
        <button
          onClick={onOpenReview}
          className="w-full py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
        >
          Start Weekly Review →
        </button>
      )}
    </div>
  );
}
