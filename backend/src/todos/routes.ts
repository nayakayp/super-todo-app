import { Hono } from 'hono';
import { db } from '../db';
import { authMiddleware } from '../auth/middleware';

export const todosRoutes = new Hono();

todosRoutes.use('*', authMiddleware);

todosRoutes.get('/', async (c) => {
  const user = c.get('user');
  const { completed, limit = '50', offset = '0' } = c.req.query();

  let query = 'SELECT * FROM todos WHERE user_id = $1';
  const params: unknown[] = [user.id];

  if (completed !== undefined) {
    query += ' AND completed = $2';
    params.push(completed === 'true');
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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

  const allowedFields = ['title', 'description', 'completed', 'priority', 'due_date'];
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
