-- Add dependencies table for todo blocking relationships
CREATE TABLE IF NOT EXISTS todo_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(todo_id, depends_on_id),
  CHECK (todo_id != depends_on_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_todo_dependencies_todo_id ON todo_dependencies(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_dependencies_depends_on ON todo_dependencies(depends_on_id);
