import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Hono } from 'hono';
import { db } from '../db';

// Create a test app with mocked auth
function createTestApp() {
  const app = new Hono();

  // Mock auth middleware that sets user
  app.use('*', async (c, next) => {
    c.set('user', { id: 'test-user-id', email: 'test@example.com', name: 'Test User' });
    await next();
  });

  // Import routes after db mock is set up
  app.get('/todos', async (c) => {
    const user = c.get('user') as { id: string };
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

    query +=
      ' GROUP BY t.id ORDER BY t.position NULLS LAST, t.created_at DESC LIMIT $' +
      (params.length + 1) +
      ' OFFSET $' +
      (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    return c.json({ todos: result.rows });
  });

  app.post('/todos', async (c) => {
    const user = c.get('user') as { id: string };
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

  app.get('/todos/:id', async (c) => {
    const user = c.get('user') as { id: string };
    const id = c.req.param('id');

    const result = await db.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [
      id,
      user.id,
    ]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    return c.json({ todo: result.rows[0] });
  });

  app.patch('/todos/:id', async (c) => {
    const user = c.get('user') as { id: string };
    const id = c.req.param('id');
    const updates = await c.req.json();

    const existingTodo = await db.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [
      id,
      user.id,
    ]);
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

  app.delete('/todos/:id', async (c) => {
    const user = c.get('user') as { id: string };
    const id = c.req.param('id');

    const result = await db.query('DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      user.id,
    ]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    return c.json({ success: true });
  });

  return app;
}

describe('Todos API', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /todos', () => {
    it('should return list of todos', async () => {
      const mockTodos = [
        { id: '1', title: 'Test Todo 1', completed: false, tags: [] },
        { id: '2', title: 'Test Todo 2', completed: true, tags: [] },
      ];

      (db.query as Mock).mockResolvedValueOnce({ rows: mockTodos });

      const res = await app.request('/todos');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.todos).toHaveLength(2);
      expect(json.todos[0].title).toBe('Test Todo 1');
    });

    it('should filter by completed status', async () => {
      const mockTodos = [{ id: '2', title: 'Completed Todo', completed: true, tags: [] }];

      (db.query as Mock).mockResolvedValueOnce({ rows: mockTodos });

      const res = await app.request('/todos?completed=true');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.todos).toHaveLength(1);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('AND t.completed'), [
        'test-user-id',
        true,
        50,
        0,
      ]);
    });

    it('should respect limit and offset', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [] });

      await app.request('/todos?limit=10&offset=20');

      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['test-user-id', 10, 20]);
    });
  });

  describe('POST /todos', () => {
    it('should create a new todo', async () => {
      const newTodo = {
        id: '1',
        title: 'New Todo',
        description: 'Description',
        priority: 2,
        due_date: '2024-12-31',
        completed: false,
      };

      (db.query as Mock).mockResolvedValueOnce({ rows: [newTodo] });

      const res = await app.request('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Todo',
          description: 'Description',
          priority: 2,
          due_date: '2024-12-31',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.todo.title).toBe('New Todo');
      expect(json.todo.priority).toBe(2);
    });

    it('should return 400 if title is missing', async () => {
      const res = await app.request('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No title' }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Title is required');
    });

    it('should create todo with default priority', async () => {
      const newTodo = { id: '1', title: 'Simple Todo', priority: 0, completed: false };

      (db.query as Mock).mockResolvedValueOnce({ rows: [newTodo] });

      const res = await app.request('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Simple Todo' }),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.todo.priority).toBe(0);
    });
  });

  describe('GET /todos/:id', () => {
    it('should return a single todo', async () => {
      const mockTodo = { id: '1', title: 'Test Todo', completed: false };

      (db.query as Mock).mockResolvedValueOnce({ rows: [mockTodo] });

      const res = await app.request('/todos/1');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.todo.id).toBe('1');
    });

    it('should return 404 if todo not found', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [] });

      const res = await app.request('/todos/nonexistent');
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Todo not found');
    });
  });

  describe('PATCH /todos/:id', () => {
    it('should update a todo', async () => {
      const existingTodo = { id: '1', title: 'Old Title', completed: false };
      const updatedTodo = { id: '1', title: 'New Title', completed: false };

      (db.query as Mock)
        .mockResolvedValueOnce({ rows: [existingTodo] })
        .mockResolvedValueOnce({ rows: [updatedTodo] });

      const res = await app.request('/todos/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.todo.title).toBe('New Title');
    });

    it('should toggle completed status', async () => {
      const existingTodo = { id: '1', title: 'Todo', completed: false };
      const updatedTodo = { id: '1', title: 'Todo', completed: true };

      (db.query as Mock)
        .mockResolvedValueOnce({ rows: [existingTodo] })
        .mockResolvedValueOnce({ rows: [updatedTodo] });

      const res = await app.request('/todos/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.todo.completed).toBe(true);
    });

    it('should return 404 if todo not found', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [] });

      const res = await app.request('/todos/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Todo not found');
    });

    it('should return existing todo if no updates provided', async () => {
      const existingTodo = { id: '1', title: 'Unchanged', completed: false };

      (db.query as Mock).mockResolvedValueOnce({ rows: [existingTodo] });

      const res = await app.request('/todos/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.todo.title).toBe('Unchanged');
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete a todo', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [{ id: '1' }] });

      const res = await app.request('/todos/1', { method: 'DELETE' });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should return 404 if todo not found', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [] });

      const res = await app.request('/todos/nonexistent', { method: 'DELETE' });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Todo not found');
    });
  });
});
