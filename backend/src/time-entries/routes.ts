import { Hono } from 'hono';
import { db } from '../db';
import { requireAuth } from '../auth/middleware';

const timeEntries = new Hono();

// Get all time entries for a todo
timeEntries.get('/todo/:todoId', requireAuth, async (c) => {
  const todoId = c.req.param('todoId');
  const userId = c.get('userId');

  // Verify todo belongs to user
  const todoCheck = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, userId]
  );
  if (todoCheck.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const result = await db.query(
    `SELECT * FROM time_entries
     WHERE todo_id = $1
     ORDER BY started_at DESC`,
    [todoId]
  );

  return c.json({ entries: result.rows });
});

// Get all time entries for user (with optional date range)
timeEntries.get('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

  let query = `
    SELECT te.*, t.title as todo_title
    FROM time_entries te
    JOIN todos t ON te.todo_id = t.id
    WHERE te.user_id = $1
  `;
  const params: (string | Date)[] = [userId];

  if (startDate) {
    params.push(startDate);
    query += ` AND te.started_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    query += ` AND te.started_at <= $${params.length}`;
  }

  query += ' ORDER BY te.started_at DESC';

  const result = await db.query(query, params);
  return c.json({ entries: result.rows });
});

// Get time tracking summary for user
timeEntries.get('/summary', requireAuth, async (c) => {
  const userId = c.get('userId');
  const period = c.req.query('period') || 'week'; // day, week, month

  let dateCondition = '';
  switch (period) {
    case 'day':
      dateCondition = "started_at >= CURRENT_DATE";
      break;
    case 'week':
      dateCondition = "started_at >= CURRENT_DATE - INTERVAL '7 days'";
      break;
    case 'month':
      dateCondition = "started_at >= CURRENT_DATE - INTERVAL '30 days'";
      break;
  }

  const result = await db.query(
    `SELECT
      COUNT(*) as total_entries,
      SUM(duration_seconds) as total_seconds,
      AVG(duration_seconds) as avg_seconds,
      MIN(duration_seconds) as min_seconds,
      MAX(duration_seconds) as max_seconds,
      COUNT(DISTINCT todo_id) as todos_worked_on,
      COUNT(DISTINCT DATE(started_at)) as days_worked
     FROM time_entries
     WHERE user_id = $1 AND ${dateCondition} AND duration_seconds IS NOT NULL`,
    [userId]
  );

  // Get time by todo
  const byTodo = await db.query(
    `SELECT t.id, t.title, SUM(te.duration_seconds) as total_seconds, COUNT(te.id) as entry_count
     FROM time_entries te
     JOIN todos t ON te.todo_id = t.id
     WHERE te.user_id = $1 AND ${dateCondition} AND te.duration_seconds IS NOT NULL
     GROUP BY t.id, t.title
     ORDER BY total_seconds DESC
     LIMIT 10`,
    [userId]
  );

  // Get time by day
  const byDay = await db.query(
    `SELECT DATE(started_at) as date, SUM(duration_seconds) as total_seconds, COUNT(*) as entry_count
     FROM time_entries
     WHERE user_id = $1 AND ${dateCondition} AND duration_seconds IS NOT NULL
     GROUP BY DATE(started_at)
     ORDER BY date DESC`,
    [userId]
  );

  return c.json({
    summary: result.rows[0],
    by_todo: byTodo.rows,
    by_day: byDay.rows,
  });
});

// Start a time entry
timeEntries.post('/start', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { todo_id, description } = body;

  if (!todo_id) {
    return c.json({ error: 'todo_id is required' }, 400);
  }

  // Verify todo belongs to user
  const todoCheck = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todo_id, userId]
  );
  if (todoCheck.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  // Check if there's already an active entry
  const activeEntry = await db.query(
    'SELECT id FROM time_entries WHERE user_id = $1 AND ended_at IS NULL',
    [userId]
  );
  if (activeEntry.rows.length > 0) {
    return c.json({ error: 'You already have an active time entry. Stop it first.' }, 400);
  }

  const result = await db.query(
    `INSERT INTO time_entries (todo_id, user_id, started_at, description)
     VALUES ($1, $2, NOW(), $3)
     RETURNING *`,
    [todo_id, userId, description || null]
  );

  return c.json({ entry: result.rows[0] }, 201);
});

// Stop a time entry
timeEntries.post('/stop', requireAuth, async (c) => {
  const userId = c.get('userId');

  // Find active entry
  const activeEntry = await db.query(
    'SELECT * FROM time_entries WHERE user_id = $1 AND ended_at IS NULL',
    [userId]
  );
  if (activeEntry.rows.length === 0) {
    return c.json({ error: 'No active time entry found' }, 404);
  }

  const entry = activeEntry.rows[0];
  const now = new Date();
  const startedAt = new Date(entry.started_at);
  const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

  // Update the entry
  const result = await db.query(
    `UPDATE time_entries
     SET ended_at = NOW(), duration_seconds = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [durationSeconds, entry.id]
  );

  // Update total time on todo
  await db.query(
    `UPDATE todos
     SET total_time_spent = COALESCE(total_time_spent, 0) + $1, updated_at = NOW()
     WHERE id = $2`,
    [durationSeconds, entry.todo_id]
  );

  return c.json({ entry: result.rows[0] });
});

// Get current active time entry
timeEntries.get('/active', requireAuth, async (c) => {
  const userId = c.get('userId');

  const result = await db.query(
    `SELECT te.*, t.title as todo_title
     FROM time_entries te
     JOIN todos t ON te.todo_id = t.id
     WHERE te.user_id = $1 AND te.ended_at IS NULL`,
    [userId]
  );

  if (result.rows.length === 0) {
    return c.json({ entry: null });
  }

  return c.json({ entry: result.rows[0] });
});

// Update a time entry (only description, or adjust times)
timeEntries.patch('/:id', requireAuth, async (c) => {
  const entryId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();

  // Verify entry belongs to user
  const entryCheck = await db.query(
    'SELECT * FROM time_entries WHERE id = $1 AND user_id = $2',
    [entryId, userId]
  );
  if (entryCheck.rows.length === 0) {
    return c.json({ error: 'Time entry not found' }, 404);
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  let paramCount = 0;

  if (body.description !== undefined) {
    paramCount++;
    updates.push(`description = $${paramCount}`);
    values.push(body.description);
  }

  if (body.duration_seconds !== undefined && typeof body.duration_seconds === 'number') {
    paramCount++;
    updates.push(`duration_seconds = $${paramCount}`);
    values.push(body.duration_seconds);
  }

  if (updates.length === 0) {
    return c.json({ entry: entryCheck.rows[0] });
  }

  paramCount++;
  updates.push(`updated_at = NOW()`);
  values.push(entryId);

  const result = await db.query(
    `UPDATE time_entries SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return c.json({ entry: result.rows[0] });
});

// Delete a time entry
timeEntries.delete('/:id', requireAuth, async (c) => {
  const entryId = c.req.param('id');
  const userId = c.get('userId');

  // Verify entry belongs to user and get duration
  const entryCheck = await db.query(
    'SELECT * FROM time_entries WHERE id = $1 AND user_id = $2',
    [entryId, userId]
  );
  if (entryCheck.rows.length === 0) {
    return c.json({ error: 'Time entry not found' }, 404);
  }

  const entry = entryCheck.rows[0];

  // Subtract duration from todo if it was completed
  if (entry.duration_seconds) {
    await db.query(
      `UPDATE todos
       SET total_time_spent = GREATEST(0, COALESCE(total_time_spent, 0) - $1), updated_at = NOW()
       WHERE id = $2`,
      [entry.duration_seconds, entry.todo_id]
    );
  }

  await db.query('DELETE FROM time_entries WHERE id = $1', [entryId]);

  return c.json({ success: true });
});

// Manual time entry (add completed entry)
timeEntries.post('/manual', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { todo_id, started_at, ended_at, duration_seconds, description } = body;

  if (!todo_id) {
    return c.json({ error: 'todo_id is required' }, 400);
  }

  if (!duration_seconds && (!started_at || !ended_at)) {
    return c.json({ error: 'Either duration_seconds or both started_at and ended_at are required' }, 400);
  }

  // Verify todo belongs to user
  const todoCheck = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todo_id, userId]
  );
  if (todoCheck.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  let finalDuration = duration_seconds;
  let startTime = started_at ? new Date(started_at) : new Date();
  let endTime = ended_at ? new Date(ended_at) : null;

  if (!finalDuration && startTime && endTime) {
    finalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  } else if (finalDuration && !endTime) {
    endTime = new Date(startTime.getTime() + finalDuration * 1000);
  }

  const result = await db.query(
    `INSERT INTO time_entries (todo_id, user_id, started_at, ended_at, duration_seconds, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [todo_id, userId, startTime, endTime, finalDuration, description || null]
  );

  // Update total time on todo
  await db.query(
    `UPDATE todos
     SET total_time_spent = COALESCE(total_time_spent, 0) + $1, updated_at = NOW()
     WHERE id = $2`,
    [finalDuration, todo_id]
  );

  return c.json({ entry: result.rows[0] }, 201);
});

export default timeEntries;
