import { useEffect, useState } from 'react';
import { useUndoStore } from '../../stores/undoStore';

export function UndoToast() {
  const pendingDeletes = useUndoStore((state) => state.pendingDeletes);
  const undoDelete = useUndoStore((state) => state.undoDelete);
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeLeft: Record<string, number> = {};
      pendingDeletes.forEach((action) => {
        const remaining = Math.max(0, 5000 - (now - action.timestamp));
        newTimeLeft[action.id] = Math.ceil(remaining / 1000);
      });
      setTimeLeft(newTimeLeft);
    }, 100);

    return () => clearInterval(interval);
  }, [pendingDeletes]);

  if (pendingDeletes.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {pendingDeletes.map((action) => (
        <div
          key={action.id}
          className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white rounded-lg shadow-lg min-w-[300px] max-w-md animate-slide-in"
        >
          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">"{action.todo.title}" deleted</p>
            <p className="text-xs text-gray-400">
              Deleting in {timeLeft[action.id] || 5}s...
            </p>
          </div>
          <button
            onClick={() => undoDelete(action.id)}
            className="px-3 py-1 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Undo
          </button>
        </div>
      ))}
    </div>
  );
}

export function useUndoableDelete() {
  const addPendingDelete = useUndoStore((state) => state.addPendingDelete);
  const undoDelete = useUndoStore((state) => state.undoDelete);

  return { addPendingDelete, undoDelete };
}
