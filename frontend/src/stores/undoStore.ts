import { create } from 'zustand';
import { Todo } from '../hooks/useTodos';

type UndoAction = {
  id: string;
  type: 'delete';
  todo: Todo;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
};

type UndoState = {
  pendingDeletes: UndoAction[];
  addPendingDelete: (todo: Todo, onConfirm: () => void, delay?: number) => string;
  undoDelete: (id: string) => Todo | undefined;
  confirmDelete: (id: string) => void;
  clearAll: () => void;
};

const UNDO_DELAY = 5000; // 5 seconds to undo

export const useUndoStore = create<UndoState>()((set, get) => ({
  pendingDeletes: [],

  addPendingDelete: (todo, onConfirm, delay = UNDO_DELAY) => {
    const id = Math.random().toString(36).substring(2, 9);
    const timeoutId = setTimeout(() => {
      const action = get().pendingDeletes.find((a) => a.id === id);
      if (action) {
        onConfirm();
        set((state) => ({
          pendingDeletes: state.pendingDeletes.filter((a) => a.id !== id),
        }));
      }
    }, delay);

    set((state) => ({
      pendingDeletes: [
        ...state.pendingDeletes,
        {
          id,
          type: 'delete',
          todo,
          timestamp: Date.now(),
          timeoutId,
        },
      ],
    }));

    return id;
  },

  undoDelete: (id) => {
    const action = get().pendingDeletes.find((a) => a.id === id);
    if (action) {
      clearTimeout(action.timeoutId);
      set((state) => ({
        pendingDeletes: state.pendingDeletes.filter((a) => a.id !== id),
      }));
      return action.todo;
    }
    return undefined;
  },

  confirmDelete: (id) => {
    const action = get().pendingDeletes.find((a) => a.id === id);
    if (action) {
      clearTimeout(action.timeoutId);
      set((state) => ({
        pendingDeletes: state.pendingDeletes.filter((a) => a.id !== id),
      }));
    }
  },

  clearAll: () => {
    const { pendingDeletes } = get();
    pendingDeletes.forEach((action) => clearTimeout(action.timeoutId));
    set({ pendingDeletes: [] });
  },
}));
