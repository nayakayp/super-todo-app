import { useState, useRef, useEffect } from 'react';
import { parseNaturalDate, formatDateForInput, getRelativeDateLabel, DATE_SHORTCUTS } from '../../lib/dateParser';
import { cn } from '../../lib/utils';

type NaturalDatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
};

export function NaturalDatePicker({
  value,
  onChange,
  placeholder = 'Due date (e.g., tomorrow, next week)',
  className,
}: NaturalDatePickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previewLabel, setPreviewLabel] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input with external value
  useEffect(() => {
    if (value) {
      setInputValue(value);
      setPreviewLabel(null);
    } else {
      setInputValue('');
      setPreviewLabel(null);
    }
  }, [value]);

  // Handle input changes
  const handleInputChange = (text: string) => {
    setInputValue(text);

    // Try to parse and show preview
    if (text.trim()) {
      const label = getRelativeDateLabel(text);
      setPreviewLabel(label);
    } else {
      setPreviewLabel(null);
    }
  };

  // Handle confirmation (Enter or blur)
  const handleConfirm = () => {
    if (!inputValue.trim()) {
      onChange('');
      return;
    }

    const parsed = parseNaturalDate(inputValue);
    if (parsed) {
      const formatted = formatDateForInput(parsed);
      onChange(formatted);
      setInputValue(formatted);
      setPreviewLabel(null);
    }
    setShowSuggestions(false);
  };

  // Handle shortcut selection
  const handleShortcutSelect = (shortcut: string) => {
    const parsed = parseNaturalDate(shortcut);
    if (parsed) {
      const formatted = formatDateForInput(parsed);
      onChange(formatted);
      setInputValue(formatted);
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    setInputValue('');
    setPreviewLabel(null);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow click on shortcuts
            setTimeout(() => handleConfirm(), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
              inputRef.current?.blur();
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 pr-8 text-sm border rounded-lg bg-white dark:bg-gray-700',
            'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            previewLabel && 'border-green-400 dark:border-green-500'
          )}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Preview label */}
      {previewLabel && (
        <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {previewLabel}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">Quick dates</div>
          <div className="grid grid-cols-2 gap-1 p-1">
            {DATE_SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
                onClick={() => handleShortcutSelect(shortcut.value)}
                className="px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {shortcut.label}
              </button>
            ))}
          </div>
          <div className="px-2 py-1 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Try: "in 3 days", "next monday", "12/25"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
type CompactNaturalDatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  className?: string;
};

export function CompactNaturalDatePicker({
  value,
  onChange,
  className,
}: CompactNaturalDatePickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (!inputValue.trim()) {
      onChange('');
    } else {
      const parsed = parseNaturalDate(inputValue);
      if (parsed) {
        onChange(formatDateForInput(parsed));
      }
    }
    setIsEditing(false);
    setInputValue('');
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleConfirm}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
          } else if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue('');
          }
        }}
        placeholder="e.g., tomorrow"
        className={cn(
          'px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700',
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setIsEditing(true);
        setInputValue(value);
      }}
      className={cn(
        'flex items-center gap-1 px-2 py-1 text-sm rounded border',
        value
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
          : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
        className
      )}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {value ? new Date(value).toLocaleDateString() : 'Set date'}
    </button>
  );
}
