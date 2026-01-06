import { cn } from '../../lib/utils';
import { Filter, useUIStore } from '../../stores/uiStore';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function FilterTabs() {
  const { filter, setFilter } = useUIStore();

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg" role="tablist">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          role="tab"
          aria-selected={filter === value}
          onClick={() => setFilter(value)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            filter === value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
