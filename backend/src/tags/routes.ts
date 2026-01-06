import { Hono } from 'hono';
import { db } from '../db';
import { authMiddleware } from '../auth/middleware';

export const tagsRoutes = new Hono();

tagsRoutes.use('*', authMiddleware);

// Get all tags for user
tagsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const result = await db.query(
    'SELECT * FROM tags WHERE user_id = $1 ORDER BY name',
    [user.id]
  );
  return c.json({ tags: result.rows });
});

// Create a new tag
tagsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const { name, color } = await c.req.json();

  if (!name || name.trim().length === 0) {
    return c.json({ error: 'Tag name is required' }, 400);
  }

  if (name.length > 50) {
    return c.json({ error: 'Tag name must be less than 50 characters' }, 400);
  }

  try {
    const result = await db.query(
      `INSERT INTO tags (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.id, name.trim(), color || '#6B7280']
    );
    return c.json({ tag: result.rows[0] }, 201);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return c.json({ error: 'Tag with this name already exists' }, 409);
    }
    throw error;
  }
});

// Update a tag
tagsRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { name, color } = await c.req.json();

  const existingTag = await db.query(
    'SELECT * FROM tags WHERE id = $1 AND user_id = $2',
    [id, user.id]
  );

  if (existingTag.rows.length === 0) {
    return c.json({ error: 'Tag not found' }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    values.push(name.trim());
    paramIndex++;
  }

  if (color !== undefined) {
    updates.push(`color = $${paramIndex}`);
    values.push(color);
    paramIndex++;
  }

  if (updates.length === 0) {
    return c.json({ tag: existingTag.rows[0] });
  }

  values.push(id, user.id);

  const result = await db.query(
    `UPDATE tags SET ${updates.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
    values
  );

  return c.json({ tag: result.rows[0] });
});

// Delete a tag
tagsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await db.query(
    'DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  );

  if (result.rows.length === 0) {
    return c.json({ error: 'Tag not found' }, 404);
  }

  return c.json({ success: true });
});

// Add tag to todo
tagsRoutes.post('/todo/:todoId/tag/:tagId', async (c) => {
  const user = c.get('user');
  const { todoId, tagId } = c.req.param();

  // Verify todo belongs to user
  const todoResult = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, user.id]
  );
  if (todoResult.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  // Verify tag belongs to user
  const tagResult = await db.query(
    'SELECT id FROM tags WHERE id = $1 AND user_id = $2',
    [tagId, user.id]
  );
  if (tagResult.rows.length === 0) {
    return c.json({ error: 'Tag not found' }, 404);
  }

  try {
    await db.query(
      'INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2)',
      [todoId, tagId]
    );
    return c.json({ success: true }, 201);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return c.json({ success: true }); // Already exists, that's fine
    }
    throw error;
  }
});

// Remove tag from todo
tagsRoutes.delete('/todo/:todoId/tag/:tagId', async (c) => {
  const user = c.get('user');
  const { todoId, tagId } = c.req.param();

  // Verify todo belongs to user
  const todoResult = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, user.id]
  );
  if (todoResult.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  await db.query(
    'DELETE FROM todo_tags WHERE todo_id = $1 AND tag_id = $2',
    [todoId, tagId]
  );

  return c.json({ success: true });
});

// Get tags for a specific todo
tagsRoutes.get('/todo/:todoId', async (c) => {
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
    `SELECT t.* FROM tags t
     INNER JOIN todo_tags tt ON t.id = tt.tag_id
     WHERE tt.todo_id = $1
     ORDER BY t.name`,
    [todoId]
  );

  return c.json({ tags: result.rows });
});
