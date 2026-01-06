-- Add recurrence fields to todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(50);
-- Patterns: 'daily', 'weekly', 'monthly', 'yearly', 'custom'

ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1;
-- E.g., every 2 days, every 3 weeks

ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurrence_days_of_week INTEGER[];
-- For weekly: array of day numbers (0=Sunday, 1=Monday, etc.)

ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
-- Optional end date for recurrence

ALTER TABLE todos ADD COLUMN IF NOT EXISTS next_occurrence DATE;
-- The next date this todo should appear

ALTER TABLE todos ADD COLUMN IF NOT EXISTS original_todo_id UUID REFERENCES todos(id) ON DELETE SET NULL;
-- Link to the original recurring todo (for generated instances)

-- Index for efficient querying of recurring todos
CREATE INDEX IF NOT EXISTS idx_todos_recurrence ON todos(recurrence_pattern) WHERE recurrence_pattern IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todos_next_occurrence ON todos(next_occurrence) WHERE next_occurrence IS NOT NULL;
