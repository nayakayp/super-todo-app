import { Hono } from 'hono';
import { db } from '../db';
import { authMiddleware } from '../auth/middleware';

export const subtasksRoutes = new Hono();

subtasksRoutes.use('*', authMiddleware);

// Get subtasks for a todo
subtasksRoutes.get('/todo/:todoId', async (c) => {
  const user = c.get('user');
  const todoId = c.req.param('todoId');

  // Verify todo belongs to user
  const todoResult = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, user.id]
  );
  if (todoResult.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const result = await db.query(
    'SELECT * FROM subtasks WHERE todo_id = $1 ORDER BY position, created_at',
    [todoId]
  );

  return c.json({ subtasks: result.rows });
});

// Create a subtask
subtasksRoutes.post('/todo/:todoId', async (c) => {
  const user = c.get('user');
  const todoId = c.req.param('todoId');
  const { title } = await c.req.json();

  if (!title || title.trim().length === 0) {
    return c.json({ error: 'Title is required' }, 400);
  }

  if (title.length > 500) {
    return c.json({ error: 'Title must be less than 500 characters' }, 400);
  }

  // Verify todo belongs to user
  const todoResult = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, user.id]
  );
  if (todoResult.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  // Get next position
  const positionResult = await db.query(
    'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM subtasks WHERE todo_id = $1',
    [todoId]
  );
  const position = positionResult.rows[0].next_position;

  const result = await db.query(
    `INSERT INTO subtasks (todo_id, title, position)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [todoId, title.trim(), position]
  );

  return c.json({ subtask: result.rows[0] }, 201);
});

// Update a subtask
subtasksRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const updates = await c.req.json();

  // Verify subtask belongs to user's todo
  const subtaskResult = await db.query(
    `SELECT s.* FROM subtasks s
     INNER JOIN todos t ON s.todo_id = t.id
     WHERE s.id = $1 AND t.user_id = $2`,
    [id, user.id]
  );
  if (subtaskResult.rows.length === 0) {
    return c.json({ error: 'Subtask not found' }, 404);
  }

  const allowedFields = ['title', 'completed', 'position'];
  const setClause: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClause.push(`${field} = $${paramIndex}`);
      values.push(updates[field]);
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    return c.json({ subtask: subtaskResult.rows[0] });
  }

  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await db.query(
    `UPDATE subtasks SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return c.json({ subtask: result.rows[0] });
});

// Delete a subtask
subtasksRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  // Verify subtask belongs to user's todo
  const result = await db.query(
    `DELETE FROM subtasks s
     USING todos t
     WHERE s.id = $1 AND s.todo_id = t.id AND t.user_id = $2
     RETURNING s.id`,
    [id, user.id]
  );

  if (result.rows.length === 0) {
    return c.json({ error: 'Subtask not found' }, 404);
  }

  return c.json({ success: true });
});

// Toggle all subtasks for a todo
subtasksRoutes.post('/todo/:todoId/toggle-all', async (c) => {
  const user = c.get('user');
  const todoId = c.req.param('todoId');
  const { completed } = await c.req.json();

  // Verify todo belongs to user
  const todoResult = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, user.id]
  );
  if (todoResult.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  await db.query(
    'UPDATE subtasks SET completed = $1, updated_at = CURRENT_TIMESTAMP WHERE todo_id = $2',
    [completed, todoId]
  );

  return c.json({ success: true });
});

// Reorder subtasks
subtasksRoutes.post('/todo/:todoId/reorder', async (c) => {
  const user = c.get('user');
  const todoId = c.req.param('todoId');
  const { items } = await c.req.json();

  if (!Array.isArray(items)) {
    return c.json({ error: 'Items must be an array' }, 400);
  }

  // Verify todo belongs to user
  const todoResult = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, user.id]
  );
  if (todoResult.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  // Update positions
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      if (item.id && typeof item.position === 'number') {
        await client.query(
          'UPDATE subtasks SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND todo_id = $3',
          [item.position, item.id, todoId]
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return c.json({ success: true });
});
