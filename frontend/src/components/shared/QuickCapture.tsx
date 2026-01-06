import { useState, useEffect, useRef } from 'react';
import { Priority, PrioritySelect } from './PrioritySelect';
import { parseNaturalDate, DateParseResult } from '../../lib/dateParser';
import { cn } from '../../lib/utils';

type QuickCaptureProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (todo: {
    title: string;
    description?: string;
    priority: Priority;
    due_date?: string;
  }) => Promise<void>;
};

export function QuickCapture({ isOpen, onClose, onCapture }: QuickCaptureProps) {
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<Priority>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [parsedDate, setParsedDate] = useState<DateParseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Parse priority from input (e.g., "!!" for high priority)
    const priorityMatch = input.match(/!{1,3}$/);
    if (priorityMatch) {
      const exclamationCount = priorityMatch[0].length;
      setPriority(Math.min(exclamationCount, 3) as Priority);
    }

    // Parse date from input
    const dateResult = parseNaturalDate(input);
    setParsedDate(dateResult);
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Ctrl+Shift+N or Cmd+Shift+N
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        // This would need to be handled by a parent component
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsCapturing(true);
    try {
      // Remove priority markers from title
      let title = input.replace(/!{1,3}$/, '').trim();

      // Remove date part from title if detected
      if (parsedDate?.date) {
        title = title.replace(parsedDate.matchedText, '').trim();
      }

      await onCapture({
        title,
        priority,
        due_date: parsedDate?.date || undefined,
      });

      setInput('');
      setPriority(0);
      setParsedDate(null);
      onClose();
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Capture
              </h2>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What needs to be done? (e.g., 'Buy groceries tomorrow !!!')"
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />

            {/* Parsed info */}
            {(parsedDate?.date || priority > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {parsedDate?.date && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                    <span>📅</span>
                    <span>{new Date(parsedDate.date).toLocaleDateString()}</span>
                  </span>
                )}
                {priority > 0 && (
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded text-sm',
                    priority === 3 ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    priority === 2 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                    'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  )}>
                    <span>🎯</span>
                    <span>Priority {priority}</span>
                  </span>
                )}
              </div>
            )}

            {/* Syntax hints */}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p><kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">!</kbd> = Low priority, <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">!!</kbd> = Medium, <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">!!!</kbd> = High</p>
              <p>Natural dates: "tomorrow", "next friday", "in 3 days"</p>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Cancel <kbd className="ml-1 text-xs text-gray-400">Esc</kbd>
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isCapturing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCapturing ? 'Capturing...' : 'Capture'}
                <kbd className="text-xs bg-blue-700 px-1 rounded">↵</kbd>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Global keyboard trigger component
type QuickCaptureProviderProps = {
  children: React.ReactNode;
  onCapture: (todo: {
    title: string;
    description?: string;
    priority: Priority;
    due_date?: string;
  }) => Promise<void>;
};

export function QuickCaptureProvider({ children, onCapture }: QuickCaptureProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Ctrl+Shift+C or Cmd+Shift+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Also open with backtick
      if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.contentEditable !== 'true') {
          e.preventDefault();
          setIsOpen(true);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {children}
      <QuickCapture
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCapture={onCapture}
      />
    </>
  );
}

// Floating quick capture button
export function QuickCaptureButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
      title="Quick capture (` or Ctrl+Shift+C)"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
