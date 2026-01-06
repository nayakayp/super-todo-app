import { useEffect, useCallback, useState } from 'react';

type KeyboardNavigationOptions = {
  itemCount: number;
  onSelect?: (index: number) => void;
  onToggle?: (index: number) => void;
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  enabled?: boolean;
};

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  enabled = true,
}: KeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      // Check if we're in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          setIsNavigating(true);
          setFocusedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : prev));
          break;

        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          setIsNavigating(true);
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;

        case 'g':
          if (e.shiftKey) {
            // G - go to bottom
            e.preventDefault();
            setFocusedIndex(itemCount - 1);
          } else {
            // g - go to top
            e.preventDefault();
            setFocusedIndex(0);
          }
          setIsNavigating(true);
          break;

        case 'Enter':
          if (focusedIndex >= 0 && onSelect) {
            e.preventDefault();
            onSelect(focusedIndex);
          }
          break;

        case ' ':
          if (focusedIndex >= 0 && onToggle) {
            e.preventDefault();
            onToggle(focusedIndex);
          }
          break;

        case 'x':
        case 'Delete':
          if (focusedIndex >= 0 && onDelete) {
            e.preventDefault();
            onDelete(focusedIndex);
          }
          break;

        case 'e':
          if (focusedIndex >= 0 && onEdit) {
            e.preventDefault();
            onEdit(focusedIndex);
          }
          break;

        case 'K':
          if (e.shiftKey && focusedIndex >= 0 && onMoveUp) {
            e.preventDefault();
            onMoveUp(focusedIndex);
            setFocusedIndex((prev) => Math.max(0, prev - 1));
          }
          break;

        case 'J':
          if (e.shiftKey && focusedIndex >= 0 && onMoveDown) {
            e.preventDefault();
            onMoveDown(focusedIndex);
            setFocusedIndex((prev) => Math.min(itemCount - 1, prev + 1));
          }
          break;

        case 'Escape':
          setFocusedIndex(-1);
          setIsNavigating(false);
          break;
      }
    },
    [enabled, itemCount, focusedIndex, onSelect, onToggle, onDelete, onEdit, onMoveUp, onMoveDown]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset focus when item count changes significantly
  useEffect(() => {
    if (focusedIndex >= itemCount) {
      setFocusedIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    isNavigating,
    clearFocus: () => {
      setFocusedIndex(-1);
      setIsNavigating(false);
    },
  };
}

// Visual indicator component
type FocusIndicatorProps = {
  isActive: boolean;
  children: React.ReactNode;
};

export function FocusIndicator({ isActive, children }: FocusIndicatorProps) {
  return (
    <div
      className={`relative ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 rounded-lg' : ''}`}
    >
      {isActive && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-blue-500">
          ▶
        </div>
      )}
      {children}
    </div>
  );
}

// Keyboard navigation help tooltip
export function KeyboardNavHelp({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'j / ↓', action: 'Move down' },
    { key: 'k / ↑', action: 'Move up' },
    { key: 'g', action: 'Go to top' },
    { key: 'G', action: 'Go to bottom' },
    { key: 'Enter', action: 'Select/Edit' },
    { key: 'Space', action: 'Toggle complete' },
    { key: 'x / Del', action: 'Delete' },
    { key: 'e', action: 'Edit' },
    { key: 'Shift+K', action: 'Move up' },
    { key: 'Shift+J', action: 'Move down' },
    { key: 'Esc', action: 'Clear focus' },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded"
      >
        <kbd className="text-[10px]">vim</kbd>
        <span>keys</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Keyboard Navigation
          </h4>
          <div className="space-y-1">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex justify-between text-xs">
                <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                  {s.key}
                </kbd>
                <span className="text-gray-500 dark:text-gray-400">{s.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
