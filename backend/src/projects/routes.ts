import { Hono } from 'hono';
import { db } from '../db';
import { requireAuth } from '../auth/middleware';

const projects = new Hono();

// Get all projects for user
projects.get('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const includeArchived = c.req.query('include_archived') === 'true';

  let query = `
    SELECT p.*,
      COUNT(CASE WHEN t.completed = false THEN 1 END) as active_count,
      COUNT(CASE WHEN t.completed = true THEN 1 END) as completed_count,
      COUNT(t.id) as total_count
    FROM projects p
    LEFT JOIN todos t ON p.id = t.project_id
    WHERE p.user_id = $1
  `;

  if (!includeArchived) {
    query += ` AND p.is_archived = false`;
  }

  query += ` GROUP BY p.id ORDER BY p.position ASC, p.created_at DESC`;

  const result = await db.query(query, [userId]);

  return c.json({ projects: result.rows });
});

// Get single project with todos
projects.get('/:id', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');

  const projectResult = await db.query(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  if (projectResult.rows.length === 0) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const todosResult = await db.query(
    `SELECT t.*,
      COALESCE(
        json_agg(
          json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)
        ) FILTER (WHERE tg.id IS NOT NULL),
        '[]'
      ) as tags
     FROM todos t
     LEFT JOIN todo_tags tt ON t.id = tt.todo_id
     LEFT JOIN tags tg ON tt.tag_id = tg.id
     WHERE t.project_id = $1
     GROUP BY t.id
     ORDER BY t.position ASC, t.created_at DESC`,
    [projectId]
  );

  return c.json({
    project: projectResult.rows[0],
    todos: todosResult.rows,
  });
});

// Create project
projects.post('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { name, description, color, icon } = body;

  if (!name || name.trim().length < 1) {
    return c.json({ error: 'name is required' }, 400);
  }

  const result = await db.query(
    `INSERT INTO projects (user_id, name, description, color, icon)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name.trim(), description || null, color || null, icon || null]
  );

  return c.json({ project: result.rows[0] }, 201);
});

// Update project
projects.patch('/:id', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();

  // Verify ownership
  const check = await db.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (check.rows.length === 0) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const allowedFields = ['name', 'description', 'color', 'icon', 'is_archived', 'position'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 0;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      paramCount++;
      updates.push(`${field} = $${paramCount}`);
      values.push(body[field]);
    }
  }

  if (updates.length === 0) {
    return c.json({ error: 'No valid fields to update' }, 400);
  }

  paramCount++;
  values.push(projectId);

  const result = await db.query(
    `UPDATE projects SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  return c.json({ project: result.rows[0] });
});

// Delete project (moves todos to no project)
projects.delete('/:id', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');

  const result = await db.query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
    [projectId, userId]
  );

  if (result.rows.length === 0) {
    return c.json({ error: 'Project not found' }, 404);
  }

  return c.json({ success: true });
});

// Move todo to project
projects.post('/:id/add-todo', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { todo_id } = body;

  if (!todo_id) {
    return c.json({ error: 'todo_id is required' }, 400);
  }

  // Verify project ownership
  const projectCheck = await db.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (projectCheck.rows.length === 0) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Verify todo ownership
  const todoCheck = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todo_id, userId]
  );
  if (todoCheck.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  // Update todo
  const result = await db.query(
    'UPDATE todos SET project_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [projectId, todo_id]
  );

  return c.json({ todo: result.rows[0] });
});

// Remove todo from project
projects.post('/remove-todo', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { todo_id } = body;

  if (!todo_id) {
    return c.json({ error: 'todo_id is required' }, 400);
  }

  // Verify todo ownership
  const todoCheck = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todo_id, userId]
  );
  if (todoCheck.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const result = await db.query(
    'UPDATE todos SET project_id = NULL, updated_at = NOW() WHERE id = $1 RETURNING *',
    [todo_id]
  );

  return c.json({ todo: result.rows[0] });
});

export default projects;
