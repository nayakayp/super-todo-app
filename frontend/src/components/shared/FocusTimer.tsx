import { useEffect, useRef } from 'react';
import { useFocusStore, formatTime } from '../../stores/focusStore';
import { useTodos } from '../../hooks/useTodos';

export function FocusTimer() {
  const {
    isActive,
    isPaused,
    mode,
    timeRemaining,
    completedPomodoros,
    focusedTodoId,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tick,
    skipToNext,
  } = useFocusStore();

  const { todos } = useTodos();
  const focusedTodo = todos?.find((t) => t.id === focusedTodoId);

  // Timer tick effect
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      tickRef.current();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  // Update document title with timer
  useEffect(() => {
    if (isActive) {
      const modeLabel = mode === 'work' ? '🍅' : mode === 'shortBreak' ? '☕' : '🌴';
      document.title = `${formatTime(timeRemaining)} ${modeLabel} - Super Todo`;
    } else {
      document.title = 'Super Todo';
    }

    return () => {
      document.title = 'Super Todo';
    };
  }, [isActive, timeRemaining, mode]);

  const getModeLabel = () => {
    switch (mode) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work':
        return 'text-red-500';
      case 'shortBreak':
        return 'text-green-500';
      case 'longBreak':
        return 'text-blue-500';
    }
  };

  const getProgressPercent = () => {
    const totalSeconds =
      mode === 'work'
        ? settings.workDuration * 60
        : mode === 'shortBreak'
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60;
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };

  if (!isActive) {
    return (
      <button
        onClick={() => startTimer()}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md"
        title="Start Pomodoro Timer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium">Start Focus</span>
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 min-w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold ${getModeColor()}`}>{getModeLabel()}</span>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span>🍅</span>
          <span>{completedPomodoros}</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative mb-4">
        <div className="text-5xl font-mono font-bold text-center text-gray-800 dark:text-white">
          {formatTime(timeRemaining)}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              mode === 'work'
                ? 'bg-red-500'
                : mode === 'shortBreak'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercent()}%` }}
          />
        </div>
      </div>

      {/* Focused Todo */}
      {focusedTodo && (
        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Focusing on:</p>
          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
            {focusedTodo.title}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {isPaused ? (
          <button
            onClick={resumeTimer}
            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
            title="Resume"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
            title="Pause"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
        )}

        <button
          onClick={skipToNext}
          className="p-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-full transition-colors"
          title="Skip to next"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 4l10 8-10 8V4zm11 0h4v16h-4V4z" />
          </svg>
        </button>

        <button
          onClick={stopTimer}
          className="p-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full transition-colors"
          title="Stop"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function FocusTimerCompact() {
  const { isActive, isPaused, mode, timeRemaining, pauseTimer, resumeTimer, stopTimer } =
    useFocusStore();

  if (!isActive) return null;

  const getModeColor = () => {
    switch (mode) {
      case 'work':
        return 'bg-red-500';
      case 'shortBreak':
        return 'bg-green-500';
      case 'longBreak':
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 flex items-center gap-3 px-4 py-2 ${getModeColor()} text-white rounded-full shadow-lg`}
    >
      <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
      <div className="flex items-center gap-1">
        {isPaused ? (
          <button
            onClick={resumeTimer}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Resume"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Pause"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
        )}
        <button
          onClick={stopTimer}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          title="Stop"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function FocusSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { settings, updateSettings } = useFocusStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Focus Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Work Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.workDuration}
              onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Short Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakDuration}
              onChange={(e) =>
                updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Long Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.longBreakDuration}
              onChange={(e) =>
                updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Long Break Interval (pomodoros)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.longBreakInterval}
              onChange={(e) =>
                updateSettings({ longBreakInterval: parseInt(e.target.value) || 4 })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
