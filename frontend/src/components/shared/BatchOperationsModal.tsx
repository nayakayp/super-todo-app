import { useState } from 'react';
import { Todo } from '../../hooks/useTodos';
import { Priority, PrioritySelect } from './PrioritySelect';
import { DatePicker } from './DatePicker';
import { cn } from '../../lib/utils';

type BatchOperation =
  | 'complete'
  | 'uncomplete'
  | 'delete'
  | 'set-priority'
  | 'set-due-date'
  | 'clear-due-date'
  | 'archive';

type BatchOperationsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedTodos: Todo[];
  onBatchComplete: (todos: Todo[]) => Promise<void>;
  onBatchUncomplete: (todos: Todo[]) => Promise<void>;
  onBatchDelete: (todos: Todo[]) => Promise<void>;
  onBatchSetPriority: (todos: Todo[], priority: Priority) => Promise<void>;
  onBatchSetDueDate: (todos: Todo[], dueDate: string | null) => Promise<void>;
};

export function BatchOperationsModal({
  isOpen,
  onClose,
  selectedTodos,
  onBatchComplete,
  onBatchUncomplete,
  onBatchDelete,
  onBatchSetPriority,
  onBatchSetDueDate,
}: BatchOperationsModalProps) {
  const [selectedOperation, setSelectedOperation] = useState<BatchOperation | null>(null);
  const [priority, setPriority] = useState<Priority>(2);
  const [dueDate, setDueDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const operations: { id: BatchOperation; label: string; icon: string; description: string; variant?: 'danger' | 'warning' | 'success' }[] = [
    { id: 'complete', label: 'Mark Complete', icon: '✅', description: 'Mark all selected todos as completed', variant: 'success' },
    { id: 'uncomplete', label: 'Mark Incomplete', icon: '⬜', description: 'Mark all selected todos as incomplete' },
    { id: 'set-priority', label: 'Set Priority', icon: '🎯', description: 'Change the priority of all selected todos' },
    { id: 'set-due-date', label: 'Set Due Date', icon: '📅', description: 'Set the same due date for all selected todos' },
    { id: 'clear-due-date', label: 'Clear Due Date', icon: '🗓️', description: 'Remove due date from all selected todos', variant: 'warning' },
    { id: 'delete', label: 'Delete All', icon: '🗑️', description: 'Permanently delete all selected todos', variant: 'danger' },
  ];

  const handleApply = async () => {
    if (!selectedOperation) return;

    setIsProcessing(true);
    try {
      switch (selectedOperation) {
        case 'complete':
          await onBatchComplete(selectedTodos);
          break;
        case 'uncomplete':
          await onBatchUncomplete(selectedTodos);
          break;
        case 'delete':
          await onBatchDelete(selectedTodos);
          break;
        case 'set-priority':
          await onBatchSetPriority(selectedTodos, priority);
          break;
        case 'set-due-date':
          await onBatchSetDueDate(selectedTodos, dueDate || null);
          break;
        case 'clear-due-date':
          await onBatchSetDueDate(selectedTodos, null);
          break;
      }
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const currentOp = operations.find(op => op.id === selectedOperation);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Batch Operations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Apply actions to {selectedTodos.length} selected todo{selectedTodos.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Operation List */}
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {operations.map((op) => (
            <button
              key={op.id}
              onClick={() => setSelectedOperation(op.id)}
              className={cn(
                'w-full p-3 rounded-lg text-left transition-all flex items-start gap-3',
                selectedOperation === op.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <span className="text-2xl">{op.icon}</span>
              <div className="flex-1">
                <div className={cn(
                  'font-medium',
                  op.variant === 'danger' ? 'text-red-600 dark:text-red-400' :
                  op.variant === 'success' ? 'text-green-600 dark:text-green-400' :
                  op.variant === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-gray-900 dark:text-white'
                )}>
                  {op.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {op.description}
                </div>
              </div>
              {selectedOperation === op.id && (
                <span className="text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Options for specific operations */}
        {selectedOperation === 'set-priority' && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Priority
            </label>
            <PrioritySelect value={priority} onChange={setPriority} />
          </div>
        )}

        {selectedOperation === 'set-due-date' && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Due Date
            </label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedTodos.length} item{selectedTodos.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedOperation || isProcessing}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                currentOp?.variant === 'danger'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {isProcessing ? 'Processing...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating action button for batch operations
type BatchFABProps = {
  selectedCount: number;
  onClick: () => void;
};

export function BatchFAB({ selectedCount, onClick }: BatchFABProps) {
  if (selectedCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 z-40"
    >
      <span className="font-medium">{selectedCount} selected</span>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    </button>
  );
}
