-- Add pinned column to todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Create index for faster pinned queries
CREATE INDEX IF NOT EXISTS idx_todos_pinned ON todos(user_id, pinned DESC, created_at DESC);
