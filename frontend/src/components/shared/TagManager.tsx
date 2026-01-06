import { useState } from 'react';
import { Tag } from '../../hooks/useTags';
import { cn } from '../../lib/utils';

const TAG_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
] as const;

type TagBadgeProps = {
  tag: Tag;
  onRemove?: () => void;
  size?: 'sm' | 'md';
};

export function TagBadge({ tag, onRemove, size = 'sm' }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

type TagSelectorProps = {
  availableTags: Tag[];
  selectedTags: Tag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<void>;
};

export function TagSelector({
  availableTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const selectedIds = new Set(selectedTags.map((t) => t.id));
  const unselectedTags = availableTags.filter((t) => !selectedIds.has(t.id));

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 items-center">
        {selectedTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => onRemoveTag(tag.id)} />
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-dashed border-gray-300 dark:border-gray-600"
        >
          + Tag
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
          {unselectedTags.length > 0 && (
            <div className="space-y-1 mb-2">
              {unselectedTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    onAddTag(tag.id);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Create new tag</div>
            <div className="flex gap-1">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTag();
                  }
                }}
              />
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isCreating}
                className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="flex gap-1 mt-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-transform',
                    newTagColor === color && 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

type TagManagerProps = {
  tags: Tag[];
  onUpdateTag: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
};

export function TagManager({ tags, onUpdateTag, onDeleteTag }: TagManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await onUpdateTag(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Tags</h3>
      {tags.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No tags yet</p>
      ) : (
        <div className="space-y-1">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
            >
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <div className="flex gap-1">
                    {TAG_COLORS.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={cn(
                          'w-4 h-4 rounded-full',
                          editColor === color && 'ring-2 ring-offset-1 ring-gray-400'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-sm dark:text-gray-200">{tag.name}</span>
                  <button
                    onClick={() => startEdit(tag)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteTag(tag.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
