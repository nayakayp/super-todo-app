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
};

function SortableTodoItem({
  todo,
  isDragDisabled = false,
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
          {todos.map((todo) => (
            <SortableTodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => onToggle(todo)}
              onDelete={() => onDelete(todo.id)}
              onUpdate={(updates) => onUpdate(todo.id, updates)}
              onDuplicate={() => onDuplicate(todo)}
              isSelected={selectedIds.has(todo.id)}
              onSelect={(selected) => onSelect(todo.id, selected)}
              showCheckbox={showCheckbox}
              isDragDisabled={isDragDisabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
