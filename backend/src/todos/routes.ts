import { Hono } from 'hono';
import { db } from '../db';
import { authMiddleware } from '../auth/middleware';

export const todosRoutes = new Hono();

todosRoutes.use('*', authMiddleware);

todosRoutes.get('/', async (c) => {
  const user = c.get('user');
  const { completed, limit = '50', offset = '0' } = c.req.query();

  let query = `
    SELECT t.*,
           COALESCE(
             json_agg(
               json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)
             ) FILTER (WHERE tg.id IS NOT NULL),
             '[]'
           ) as tags
    FROM todos t
    LEFT JOIN todo_tags tt ON t.id = tt.todo_id
    LEFT JOIN tags tg ON tt.tag_id = tg.id
    WHERE t.user_id = $1`;
  const params: unknown[] = [user.id];

  if (completed !== undefined) {
    query += ' AND t.completed = $2';
    params.push(completed === 'true');
  }

  query += ' GROUP BY t.id ORDER BY t.position NULLS LAST, t.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(parseInt(limit), parseInt(offset));

  const result = await db.query(query, params);
  return c.json({ todos: result.rows });
});

todosRoutes.post('/', async (c) => {
  const user = c.get('user');
  const { title, description, priority, due_date } = await c.req.json();

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  const result = await db.query(
    `INSERT INTO todos (user_id, title, description, priority, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user.id, title, description || null, priority || 0, due_date || null]
  );

  return c.json({ todo: result.rows[0] }, 201);
});

todosRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await db.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, user.id]);

  if (result.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  return c.json({ todo: result.rows[0] });
});

todosRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const updates = await c.req.json();

  const existingTodo = await db.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, user.id]);
  if (existingTodo.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const allowedFields = ['title', 'description', 'completed', 'priority', 'due_date', 'position'];
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
    return c.json({ todo: existingTodo.rows[0] });
  }

  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id, user.id);

  const result = await db.query(
    `UPDATE todos SET ${setClause.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
    values
  );

  return c.json({ todo: result.rows[0] });
});

todosRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await db.query('DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id', [id, user.id]);

  if (result.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  return c.json({ success: true });
});

// Batch reorder endpoint
todosRoutes.post('/reorder', async (c) => {
  const user = c.get('user');
  const { items } = await c.req.json();

  if (!Array.isArray(items)) {
    return c.json({ error: 'Items must be an array' }, 400);
  }

  // Update positions in a transaction
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      if (item.id && typeof item.position === 'number') {
        await client.query(
          'UPDATE todos SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
          [item.position, item.id, user.id]
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
