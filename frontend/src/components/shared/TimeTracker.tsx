import { useState, useEffect } from 'react';
import { useTimeEntries, formatDuration, formatDurationHMS } from '../../hooks/useTimeEntries';
import { cn } from '../../lib/utils';

type TimeTrackerProps = {
  todoId: string;
  todoTitle: string;
  totalTimeSpent?: number;
  compact?: boolean;
  className?: string;
};

export function TimeTracker({
  todoId,
  todoTitle,
  totalTimeSpent = 0,
  compact = false,
  className,
}: TimeTrackerProps) {
  const { activeEntry, startTracking, stopTracking, isStarting, isStopping } = useTimeEntries();
  const [elapsedTime, setElapsedTime] = useState(0);

  const isTrackingThis = activeEntry?.todo_id === todoId;
  const isTrackingOther = activeEntry && !isTrackingThis;

  // Update elapsed time for active entry
  useEffect(() => {
    if (!isTrackingThis || !activeEntry) {
      setElapsedTime(0);
      return;
    }

    const startedAt = new Date(activeEntry.started_at).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startedAt) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isTrackingThis, activeEntry]);

  const handleToggle = async () => {
    if (isTrackingThis) {
      await stopTracking();
    } else {
      await startTracking({ todoId });
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={handleToggle}
          disabled={isStarting || isStopping || !!isTrackingOther}
          className={cn(
            'p-1.5 rounded-full transition-colors',
            isTrackingThis
              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300',
            (isStarting || isStopping || !!isTrackingOther) && 'opacity-50 cursor-not-allowed'
          )}
          title={isTrackingThis ? 'Stop tracking' : isTrackingOther ? 'Stop other timer first' : 'Start tracking'}
        >
          {isTrackingThis ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        {isTrackingThis && (
          <span className="text-sm font-mono text-red-600 dark:text-red-400 animate-pulse">
            {formatDurationHMS(elapsedTime)}
          </span>
        )}
        {!isTrackingThis && totalTimeSpent > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDuration(totalTimeSpent)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Tracking</h4>
        {totalTimeSpent > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total: {formatDuration(totalTimeSpent)}
          </span>
        )}
      </div>

      {isTrackingThis ? (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-red-600 dark:text-red-400">
              {formatDurationHMS(elapsedTime)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              Tracking: {todoTitle}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isStopping}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            {isStopping ? 'Stopping...' : 'Stop Tracking'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleToggle}
          disabled={isStarting || !!isTrackingOther}
          className={cn(
            'w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors',
            isTrackingOther
              ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          )}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isStarting ? 'Starting...' : isTrackingOther ? 'Stop other timer first' : 'Start Tracking'}
        </button>
      )}
    </div>
  );
}

// Floating widget showing active time tracking
export function ActiveTimeTrackerWidget() {
  const { activeEntry, stopTracking, isStopping } = useTimeEntries();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!activeEntry) {
      setElapsedTime(0);
      return;
    }

    const startedAt = new Date(activeEntry.started_at).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startedAt) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  if (!activeEntry) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-red-600 text-white rounded-lg shadow-lg p-3 flex items-center gap-3 z-50 animate-slide-up">
      <div className="animate-pulse">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div>
        <div className="font-mono font-bold">{formatDurationHMS(elapsedTime)}</div>
        <div className="text-xs text-red-200 truncate max-w-[150px]">
          {activeEntry.todo_title}
        </div>
      </div>
      <button
        onClick={() => stopTracking()}
        disabled={isStopping}
        className="p-1.5 bg-red-700 hover:bg-red-800 rounded"
        title="Stop tracking"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      </button>
    </div>
  );
}

// Time entries list for a todo
type TimeEntryListProps = {
  todoId: string;
  className?: string;
};

export function TimeEntryList({ todoId, className }: TimeEntryListProps) {
  const { entries, isLoading, deleteEntry, addManualEntry } = useTimeEntries(todoId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualHours, setManualHours] = useState('0');
  const [manualMinutes, setManualMinutes] = useState('30');
  const [manualDescription, setManualDescription] = useState('');

  const handleAddManual = async () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const duration = hours * 3600 + minutes * 60;

    if (duration <= 0) return;

    await addManualEntry({
      todoId,
      duration_seconds: duration,
      description: manualDescription || undefined,
    });

    setManualHours('0');
    setManualMinutes('30');
    setManualDescription('');
    setShowAddForm(false);
  };

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading time entries...</div>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Time Entries ({entries.length})
        </h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {showAddForm ? 'Cancel' : '+ Add Manual'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          />
          <button
            onClick={handleAddManual}
            className="w-full py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Entry
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No time entries yet.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm"
            >
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {entry.duration_seconds ? formatDuration(entry.duration_seconds) : 'In progress...'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(entry.started_at).toLocaleDateString()}{' '}
                  {new Date(entry.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {entry.description && ` - ${entry.description}`}
                </div>
              </div>
              {entry.duration_seconds && (
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete entry"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
