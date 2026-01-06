import { Hono } from 'hono';
import { db } from '../db';
import { requireAuth } from '../auth/middleware';

const templates = new Hono();

// Get all templates for user
templates.get('/', requireAuth, async (c) => {
  const userId = c.get('userId');

  const result = await db.query(
    `SELECT * FROM todo_templates
     WHERE user_id = $1
     ORDER BY usage_count DESC, position ASC`,
    [userId]
  );

  return c.json({ templates: result.rows });
});

// Get single template
templates.get('/:id', requireAuth, async (c) => {
  const templateId = c.req.param('id');
  const userId = c.get('userId');

  const result = await db.query(
    'SELECT * FROM todo_templates WHERE id = $1 AND user_id = $2',
    [templateId, userId]
  );

  if (result.rows.length === 0) {
    return c.json({ error: 'Template not found' }, 404);
  }

  return c.json({ template: result.rows[0] });
});

// Create template
templates.post('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const {
    name,
    title,
    description,
    priority,
    tags,
    default_due_days,
    recurrence_pattern,
    recurrence_interval,
    recurrence_days_of_week,
    icon,
    color,
  } = body;

  if (!name || !title) {
    return c.json({ error: 'name and title are required' }, 400);
  }

  const result = await db.query(
    `INSERT INTO todo_templates (
      user_id, name, title, description, priority, tags,
      default_due_days, recurrence_pattern, recurrence_interval,
      recurrence_days_of_week, icon, color
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      userId,
      name,
      title,
      description || null,
      priority || 0,
      tags || null,
      default_due_days || null,
      recurrence_pattern || null,
      recurrence_interval || 1,
      recurrence_days_of_week || null,
      icon || null,
      color || null,
    ]
  );

  return c.json({ template: result.rows[0] }, 201);
});

// Update template
templates.patch('/:id', requireAuth, async (c) => {
  const templateId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();

  // Verify ownership
  const check = await db.query(
    'SELECT id FROM todo_templates WHERE id = $1 AND user_id = $2',
    [templateId, userId]
  );
  if (check.rows.length === 0) {
    return c.json({ error: 'Template not found' }, 404);
  }

  const allowedFields = [
    'name', 'title', 'description', 'priority', 'tags',
    'default_due_days', 'recurrence_pattern', 'recurrence_interval',
    'recurrence_days_of_week', 'icon', 'color', 'position'
  ];

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
  values.push(templateId);

  const result = await db.query(
    `UPDATE todo_templates SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  return c.json({ template: result.rows[0] });
});

// Delete template
templates.delete('/:id', requireAuth, async (c) => {
  const templateId = c.req.param('id');
  const userId = c.get('userId');

  const result = await db.query(
    'DELETE FROM todo_templates WHERE id = $1 AND user_id = $2 RETURNING id',
    [templateId, userId]
  );

  if (result.rows.length === 0) {
    return c.json({ error: 'Template not found' }, 404);
  }

  return c.json({ success: true });
});

// Use template to create a todo
templates.post('/:id/use', requireAuth, async (c) => {
  const templateId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { title_override, description_override } = body;

  // Get template
  const templateResult = await db.query(
    'SELECT * FROM todo_templates WHERE id = $1 AND user_id = $2',
    [templateId, userId]
  );

  if (templateResult.rows.length === 0) {
    return c.json({ error: 'Template not found' }, 404);
  }

  const template = templateResult.rows[0];

  // Calculate due date if default_due_days is set
  let dueDate = null;
  if (template.default_due_days) {
    const date = new Date();
    date.setDate(date.getDate() + template.default_due_days);
    dueDate = date.toISOString().split('T')[0];
  }

  // Create the todo
  const todoResult = await db.query(
    `INSERT INTO todos (
      user_id, title, description, priority, due_date,
      recurrence_pattern, recurrence_interval, recurrence_days_of_week
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      userId,
      title_override || template.title,
      description_override || template.description,
      template.priority || 0,
      dueDate,
      template.recurrence_pattern,
      template.recurrence_interval,
      template.recurrence_days_of_week,
    ]
  );

  const todo = todoResult.rows[0];

  // Add tags if specified
  if (template.tags && template.tags.length > 0) {
    for (const tagName of template.tags) {
      // Find or create the tag
      let tagResult = await db.query(
        'SELECT id FROM tags WHERE user_id = $1 AND name = $2',
        [userId, tagName]
      );

      if (tagResult.rows.length === 0) {
        tagResult = await db.query(
          'INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING id',
          [userId, tagName]
        );
      }

      // Link tag to todo
      await db.query(
        'INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [todo.id, tagResult.rows[0].id]
      );
    }
  }

  // Increment usage count
  await db.query(
    'UPDATE todo_templates SET usage_count = usage_count + 1 WHERE id = $1',
    [templateId]
  );

  // Fetch the complete todo with tags
  const completeTodoResult = await db.query(
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
     WHERE t.id = $1
     GROUP BY t.id`,
    [todo.id]
  );

  return c.json({ todo: completeTodoResult.rows[0] }, 201);
});

export default templates;
