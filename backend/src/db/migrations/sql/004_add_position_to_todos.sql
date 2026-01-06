-- Add position column for drag-and-drop reordering
ALTER TABLE todos ADD COLUMN IF NOT EXISTS position INTEGER;

-- Set default position based on creation order
UPDATE todos SET position = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM todos
) sub
WHERE todos.id = sub.id AND todos.position IS NULL;

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_todos_position ON todos(user_id, position);
