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
  const {
    title,
    description,
    priority,
    due_date,
    recurrence_pattern,
    recurrence_interval,
    recurrence_days_of_week,
    recurrence_end_date,
  } = await c.req.json();

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  // Calculate next_occurrence based on recurrence pattern
  let next_occurrence = null;
  if (recurrence_pattern && due_date) {
    next_occurrence = due_date;
  }

  const result = await db.query(
    `INSERT INTO todos (user_id, title, description, priority, due_date,
     recurrence_pattern, recurrence_interval, recurrence_days_of_week,
     recurrence_end_date, next_occurrence)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      user.id,
      title,
      description || null,
      priority || 0,
      due_date || null,
      recurrence_pattern || null,
      recurrence_interval || 1,
      recurrence_days_of_week || null,
      recurrence_end_date || null,
      next_occurrence,
    ]
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

  const allowedFields = [
    'title',
    'description',
    'completed',
    'priority',
    'due_date',
    'position',
    'recurrence_pattern',
    'recurrence_interval',
    'recurrence_days_of_week',
    'recurrence_end_date',
    'next_occurrence',
  ];
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

// Helper function to calculate next occurrence
function calculateNextOccurrence(
  currentDate: Date,
  pattern: string,
  interval: number,
  daysOfWeek?: number[]
): Date {
  const next = new Date(currentDate);

  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find next matching day of week
        let found = false;
        for (let i = 1; i <= 7 * interval && !found; i++) {
          next.setDate(currentDate.getDate() + i);
          if (daysOfWeek.includes(next.getDay())) {
            found = true;
          }
        }
        if (!found) {
          next.setDate(currentDate.getDate() + 7 * interval);
        }
      } else {
        next.setDate(next.getDate() + 7 * interval);
      }
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      next.setDate(next.getDate() + interval);
  }

  return next;
}

// Complete a recurring todo and create next occurrence
todosRoutes.post('/:id/complete-recurring', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const todoResult = await db.query(
    'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
    [id, user.id]
  );

  if (todoResult.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const todo = todoResult.rows[0];

  if (!todo.recurrence_pattern) {
    return c.json({ error: 'Todo is not recurring' }, 400);
  }

  // Mark current todo as completed
  await db.query(
    'UPDATE todos SET completed = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  // Calculate next occurrence
  const currentDueDate = todo.due_date ? new Date(todo.due_date) : new Date();
  const nextDate = calculateNextOccurrence(
    currentDueDate,
    todo.recurrence_pattern,
    todo.recurrence_interval || 1,
    todo.recurrence_days_of_week
  );

  // Check if next occurrence is beyond end date
  if (todo.recurrence_end_date && nextDate > new Date(todo.recurrence_end_date)) {
    return c.json({
      todo: { ...todo, completed: true },
      nextTodo: null,
      message: 'Recurrence ended',
    });
  }

  // Create next occurrence
  const nextTodoResult = await db.query(
    `INSERT INTO todos (
      user_id, title, description, priority, due_date,
      recurrence_pattern, recurrence_interval, recurrence_days_of_week,
      recurrence_end_date, next_occurrence, original_todo_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      user.id,
      todo.title,
      todo.description,
      todo.priority,
      nextDate.toISOString().split('T')[0],
      todo.recurrence_pattern,
      todo.recurrence_interval,
      todo.recurrence_days_of_week,
      todo.recurrence_end_date,
      nextDate.toISOString().split('T')[0],
      todo.original_todo_id || todo.id,
    ]
  );

  return c.json({
    todo: { ...todo, completed: true },
    nextTodo: nextTodoResult.rows[0],
  });
});
