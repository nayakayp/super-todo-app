import { cn } from '../../lib/utils';

type BulkActionsProps = {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onCompleteSelected: () => void;
  onUncompleteSelected: () => void;
  className?: string;
};

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onCompleteSelected,
  onUncompleteSelected,
  className,
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return (
      <button
        onClick={onSelectAll}
        className={cn('text-sm text-blue-600 dark:text-blue-400 hover:underline', className)}
      >
        Select all ({totalCount})
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg', className)}>
      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onCompleteSelected}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Complete
        </button>
        <button
          onClick={onUncompleteSelected}
          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Uncomplete
        </button>
        <button
          onClick={onDeleteSelected}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
        <button
          onClick={onDeselectAll}
          className="px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
