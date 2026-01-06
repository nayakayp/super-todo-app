import { cn } from '../../lib/utils';

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  min?: string;
};

export function DatePicker({ value, onChange, className, min }: DatePickerProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min ?? today}
      className={cn(
        'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
    />
  );
}

export function formatDueDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (dueDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  const isOverdue = dueDate < today;
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return isOverdue ? `Overdue: ${formatted}` : formatted;
}

export function DueDateBadge({ dueDate }: { dueDate: string | null }) {
  const formatted = formatDueDate(dueDate);
  if (!formatted) return null;

  const isOverdue = formatted.startsWith('Overdue');
  const isToday = formatted === 'Today';

  return (
    <span
      className={cn(
        'text-xs font-medium',
        isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-gray-500'
      )}
    >
      {formatted}
    </span>
  );
}
