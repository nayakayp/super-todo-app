-- Todo templates for quick add
CREATE TABLE IF NOT EXISTS todo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  tags TEXT[], -- Array of tag names to auto-add
  default_due_days INTEGER, -- Days from creation to set as due date
  recurrence_pattern VARCHAR(20),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days_of_week INTEGER[],
  icon VARCHAR(50), -- Emoji or icon name
  color VARCHAR(20), -- Hex color for the template button
  usage_count INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_todo_templates_user_id ON todo_templates(user_id);
