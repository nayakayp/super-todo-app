import { cn } from '../../lib/utils';

export type Priority = 0 | 1 | 2;

type PrioritySelectProps = {
  value: Priority;
  onChange: (value: Priority) => void;
  className?: string;
};

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 0, label: 'Low', color: 'text-gray-500' },
  { value: 1, label: 'Medium', color: 'text-yellow-600' },
  { value: 2, label: 'High', color: 'text-red-600' },
];

export function PrioritySelect({ value, onChange, className }: PrioritySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as Priority)}
      className={cn(
        'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
    >
      {priorities.map((priority) => (
        <option key={priority.value} value={priority.value}>
          {priority.label}
        </option>
      ))}
    </select>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorities.find((p) => p.value === priority) ?? priorities[0]!;
  return (
    <span className={cn('text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
}
