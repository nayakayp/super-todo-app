import { useEffect, useState } from 'react';

type Shortcut = {
  key: string;
  description: string;
  modifiers?: ('ctrl' | 'shift' | 'alt')[];
};

const shortcuts: Shortcut[] = [
  { key: 'n', description: 'New todo', modifiers: ['ctrl'] },
  { key: '/', description: 'Focus search' },
  { key: 'a', description: 'Show all todos' },
  { key: 'c', description: 'Show completed' },
  { key: 'p', description: 'Show active (pending)' },
  { key: 's', description: 'Toggle select mode', modifiers: ['ctrl'] },
  { key: 'd', description: 'Toggle dark mode', modifiers: ['ctrl'] },
  { key: '?', description: 'Show shortcuts', modifiers: ['shift'] },
  { key: 'Escape', description: 'Close modal / Cancel' },
];

type KeyboardShortcutsProps = {
  onNewTodo: () => void;
  onFocusSearch: () => void;
  onFilterAll: () => void;
  onFilterCompleted: () => void;
  onFilterActive: () => void;
  onToggleSelectMode: () => void;
  onToggleDarkMode: () => void;
};

export function useKeyboardShortcuts({
  onNewTodo,
  onFocusSearch,
  onFilterAll,
  onFilterCompleted,
  onFilterActive,
  onToggleSelectMode,
  onToggleDarkMode,
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl+N: New todo
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        onNewTodo();
        return;
      }

      // Ctrl+S: Toggle select mode
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onToggleSelectMode();
        return;
      }

      // Ctrl+D: Toggle dark mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        onToggleDarkMode();
        return;
      }

      // Shift+?: Show shortcuts
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // /: Focus search
      if (e.key === '/') {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      // a: Show all
      if (e.key === 'a') {
        onFilterAll();
        return;
      }

      // c: Show completed
      if (e.key === 'c') {
        onFilterCompleted();
        return;
      }

      // p: Show active
      if (e.key === 'p') {
        onFilterActive();
        return;
      }

      // Escape: Close help
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewTodo, onFocusSearch, onFilterAll, onFilterCompleted, onFilterActive, onToggleSelectMode, onToggleDarkMode]);

  return { showHelp, setShowHelp };
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                {shortcut.modifiers?.map((m) => m.charAt(0).toUpperCase() + m.slice(1) + '+').join('')}
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
