import { Hono } from 'hono';
import { db } from '../db';
import { requireAuth } from '../auth/middleware';

const activityLog = new Hono();

// Activity action types
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'completed'
  | 'uncompleted'
  | 'deleted'
  | 'restored'
  | 'priority_changed'
  | 'due_date_set'
  | 'due_date_changed'
  | 'due_date_removed'
  | 'project_assigned'
  | 'project_removed'
  | 'tag_added'
  | 'tag_removed'
  | 'subtask_added'
  | 'subtask_completed'
  | 'time_tracked';

// Helper to log activity
export async function logActivity(
  userId: string,
  todoId: string | null,
  action: ActivityAction,
  options?: {
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await db.query(
      `INSERT INTO activity_log (user_id, todo_id, action, field_name, old_value, new_value, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        todoId,
        action,
        options?.fieldName || null,
        options?.oldValue || null,
        options?.newValue || null,
        options?.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break the main operation
  }
}

// Get activity log for user
activityLog.get('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const todoId = c.req.query('todo_id');
  const action = c.req.query('action');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

  let query = `
    SELECT al.*,
      t.title as todo_title,
      t.completed as todo_completed
    FROM activity_log al
    LEFT JOIN todos t ON al.todo_id = t.id
    WHERE al.user_id = $1
  `;
  const params: (string | number)[] = [userId];

  if (todoId) {
    params.push(todoId);
    query += ` AND al.todo_id = $${params.length}`;
  }

  if (action) {
    params.push(action);
    query += ` AND al.action = $${params.length}`;
  }

  if (startDate) {
    params.push(startDate);
    query += ` AND al.created_at >= $${params.length}`;
  }

  if (endDate) {
    params.push(endDate);
    query += ` AND al.created_at <= $${params.length}`;
  }

  query += ` ORDER BY al.created_at DESC`;

  params.push(limit);
  query += ` LIMIT $${params.length}`;

  params.push(offset);
  query += ` OFFSET $${params.length}`;

  const result = await db.query(query, params);

  // Get total count
  let countQuery = `
    SELECT COUNT(*) as total
    FROM activity_log al
    WHERE al.user_id = $1
  `;
  const countParams: string[] = [userId];

  if (todoId) {
    countParams.push(todoId);
    countQuery += ` AND al.todo_id = $${countParams.length}`;
  }

  if (action) {
    countParams.push(action);
    countQuery += ` AND al.action = $${countParams.length}`;
  }

  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].total);

  return c.json({
    activities: result.rows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + result.rows.length < total,
    },
  });
});

// Get activity summary (stats)
activityLog.get('/summary', requireAuth, async (c) => {
  const userId = c.get('userId');
  const period = c.req.query('period') || 'week'; // day, week, month

  let dateCondition = '';
  switch (period) {
    case 'day':
      dateCondition = "created_at >= CURRENT_DATE";
      break;
    case 'week':
      dateCondition = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      break;
    case 'month':
      dateCondition = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
      break;
  }

  // Activity counts by action type
  const byAction = await db.query(
    `SELECT action, COUNT(*) as count
     FROM activity_log
     WHERE user_id = $1 AND ${dateCondition}
     GROUP BY action
     ORDER BY count DESC`,
    [userId]
  );

  // Activity by day
  const byDay = await db.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM activity_log
     WHERE user_id = $1 AND ${dateCondition}
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [userId]
  );

  // Most active todos
  const byTodo = await db.query(
    `SELECT al.todo_id, t.title, COUNT(*) as count
     FROM activity_log al
     JOIN todos t ON al.todo_id = t.id
     WHERE al.user_id = $1 AND ${dateCondition}
     GROUP BY al.todo_id, t.title
     ORDER BY count DESC
     LIMIT 5`,
    [userId]
  );

  return c.json({
    by_action: byAction.rows,
    by_day: byDay.rows,
    by_todo: byTodo.rows,
  });
});

// Get activity for a specific todo
activityLog.get('/todo/:todoId', requireAuth, async (c) => {
  const todoId = c.req.param('todoId');
  const userId = c.get('userId');

  // Verify todo ownership
  const todoCheck = await db.query(
    'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, userId]
  );
  if (todoCheck.rows.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const result = await db.query(
    `SELECT * FROM activity_log
     WHERE todo_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [todoId]
  );

  return c.json({ activities: result.rows });
});

export default activityLog;
