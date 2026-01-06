import { useState } from 'react';
import { RecurrencePattern } from '../../hooks/useTodos';
import { cn } from '../../lib/utils';

type RecurrenceConfig = {
  pattern: RecurrencePattern | null;
  interval: number;
  daysOfWeek: number[];
  endDate: string;
};

type RecurrenceSelectProps = {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  className?: string;
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PATTERN_LABELS: Record<RecurrencePattern, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function RecurrenceSelect({ value, onChange, className }: RecurrenceSelectProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handlePatternChange = (pattern: RecurrencePattern | null) => {
    onChange({
      ...value,
      pattern,
      daysOfWeek: pattern === 'weekly' ? value.daysOfWeek : [],
    });
  };

  const handleIntervalChange = (interval: number) => {
    onChange({ ...value, interval: Math.max(1, interval) });
  };

  const toggleDayOfWeek = (day: number) => {
    const newDays = value.daysOfWeek.includes(day)
      ? value.daysOfWeek.filter((d) => d !== day)
      : [...value.daysOfWeek, day].sort();
    onChange({ ...value, daysOfWeek: newDays });
  };

  const getRecurrenceLabel = () => {
    if (!value.pattern) return 'No repeat';

    const intervalText =
      value.interval === 1
        ? PATTERN_LABELS[value.pattern]
        : `Every ${value.interval} ${value.pattern === 'daily' ? 'days' : value.pattern === 'weekly' ? 'weeks' : value.pattern === 'monthly' ? 'months' : 'years'}`;

    if (value.pattern === 'weekly' && value.daysOfWeek.length > 0) {
      const days = value.daysOfWeek.map((d) => DAYS_OF_WEEK[d]).join(', ');
      return `${intervalText} on ${days}`;
    }

    return intervalText;
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors',
          value.pattern
            ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="truncate max-w-[150px]">{getRecurrenceLabel()}</span>
      </button>

      {showOptions && (
        <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          {/* Pattern selection */}
          <div className="space-y-2 mb-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Repeat</label>
            <div className="grid grid-cols-5 gap-1">
              <button
                type="button"
                onClick={() => handlePatternChange(null)}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  !value.pattern
                    ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                None
              </button>
              {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrencePattern[]).map((pattern) => (
                <button
                  key={pattern}
                  type="button"
                  onClick={() => handlePatternChange(pattern)}
                  className={cn(
                    'px-2 py-1 text-xs rounded capitalize',
                    value.pattern === pattern
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {pattern.slice(0, 1).toUpperCase() + pattern.slice(1, 3)}
                </button>
              ))}
            </div>
          </div>

          {value.pattern && (
            <>
              {/* Interval */}
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Every</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={value.interval}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {value.pattern === 'daily'
                    ? value.interval === 1
                      ? 'day'
                      : 'days'
                    : value.pattern === 'weekly'
                    ? value.interval === 1
                      ? 'week'
                      : 'weeks'
                    : value.pattern === 'monthly'
                    ? value.interval === 1
                      ? 'month'
                      : 'months'
                    : value.interval === 1
                    ? 'year'
                    : 'years'}
                </span>
              </div>

              {/* Days of week for weekly */}
              {value.pattern === 'weekly' && (
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                    On days
                  </label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOfWeek(index)}
                        className={cn(
                          'w-8 h-8 text-xs rounded-full transition-colors',
                          value.daysOfWeek.includes(index)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        {day[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* End date */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Until</label>
                <input
                  type="date"
                  value={value.endDate}
                  onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                {value.endDate && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, endDate: '' })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={() => setShowOptions(false)}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RecurrenceBadge({ pattern }: { pattern: RecurrencePattern | null }) {
  if (!pattern) return null;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {PATTERN_LABELS[pattern]}
    </span>
  );
}
