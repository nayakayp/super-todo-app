import { cn } from '../../lib/utils';
import { Theme, useUIStore } from '../../stores/uiStore';

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useUIStore();

  return (
    <div className={cn('flex items-center gap-1', className)} role="radiogroup" aria-label="Theme">
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
            theme === value
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          title={label}
        >
          <span aria-hidden="true">{icon}</span>
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
