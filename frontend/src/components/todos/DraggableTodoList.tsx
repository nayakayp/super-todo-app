import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '../../hooks/useTodos';
import { TodoItem } from './TodoItem';
import { useKeyboardNavigation, FocusIndicator, KeyboardNavHelp } from '../../hooks/useKeyboardNavigation';

type SortableTodoItemProps = {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Todo>) => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  showCheckbox?: boolean;
  isDragDisabled?: boolean;
  isFocused?: boolean;
};

function SortableTodoItem({
  todo,
  isDragDisabled = false,
  isFocused = false,
  ...props
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FocusIndicator isActive={isFocused}>
        <div className="flex items-stretch">
          {!isDragDisabled && (
            <button
              {...attributes}
              {...listeners}
              className="flex items-center px-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Drag to reorder"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            <TodoItem todo={todo} {...props} />
          </div>
        </div>
      </FocusIndicator>
    </div>
  );
}

type DraggableTodoListProps = {
  todos: Todo[];
  onReorder: (items: { id: string; position: number }[]) => void;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDuplicate: (todo: Todo) => void;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  showCheckbox: boolean;
  isDragDisabled?: boolean;
};

export function DraggableTodoList({
  todos,
  onReorder,
  onToggle,
  onDelete,
  onUpdate,
  onDuplicate,
  selectedIds,
  onSelect,
  showCheckbox,
  isDragDisabled = false,
}: DraggableTodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Keyboard navigation
  const { focusedIndex, isNavigating } = useKeyboardNavigation({
    itemCount: todos.length,
    onToggle: (index) => onToggle(todos[index]),
    onDelete: (index) => onDelete(todos[index].id),
    onEdit: (index) => {
      // Trigger edit by clicking the title
      const todoEl = document.querySelector(`[data-todo-index="${index}"] h3`);
      if (todoEl instanceof HTMLElement) todoEl.click();
    },
    onMoveUp: (index) => {
      if (index > 0 && !isDragDisabled) {
        const reorderedTodos = arrayMove(todos, index, index - 1);
        onReorder(reorderedTodos.map((t, i) => ({ id: t.id, position: i })));
      }
    },
    onMoveDown: (index) => {
      if (index < todos.length - 1 && !isDragDisabled) {
        const reorderedTodos = arrayMove(todos, index, index + 1);
        onReorder(reorderedTodos.map((t, i) => ({ id: t.id, position: i })));
      }
    },
    enabled: !showCheckbox, // Disable when in selection mode
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id);
      const newIndex = todos.findIndex((t) => t.id === over.id);
      const reorderedTodos = arrayMove(todos, oldIndex, newIndex);

      // Create position updates
      const items = reorderedTodos.map((todo, index) => ({
        id: todo.id,
        position: index,
      }));

      onReorder(items);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {isNavigating && (
            <div className="flex justify-end mb-2">
              <KeyboardNavHelp />
            </div>
          )}
          {todos.map((todo, index) => (
            <div key={todo.id} data-todo-index={index}>
              <SortableTodoItem
                todo={todo}
                onToggle={() => onToggle(todo)}
                onDelete={() => onDelete(todo.id)}
                onUpdate={(updates) => onUpdate(todo.id, updates)}
                onDuplicate={() => onDuplicate(todo)}
                isSelected={selectedIds.has(todo.id)}
                onSelect={(selected) => onSelect(todo.id, selected)}
                showCheckbox={showCheckbox}
                isDragDisabled={isDragDisabled}
                isFocused={focusedIndex === index}
              />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
