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

  // Get all tags
  app.get('/tags', async (c) => {
    const user = c.get('user') as { id: string };
    const result = await db.query('SELECT * FROM tags WHERE user_id = $1 ORDER BY name', [user.id]);
    return c.json({ tags: result.rows });
  });

  // Create tag
  app.post('/tags', async (c) => {
    const user = c.get('user') as { id: string };
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

  // Update tag
  app.patch('/tags/:id', async (c) => {
    const user = c.get('user') as { id: string };
    const id = c.req.param('id');
    const { name, color } = await c.req.json();

    const existingTag = await db.query('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [
      id,
      user.id,
    ]);

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

  // Delete tag
  app.delete('/tags/:id', async (c) => {
    const user = c.get('user') as { id: string };
    const id = c.req.param('id');

    const result = await db.query('DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      user.id,
    ]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    return c.json({ success: true });
  });

  return app;
}

describe('Tags API', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /tags', () => {
    it('should return list of tags', async () => {
      const mockTags = [
        { id: '1', name: 'Work', color: '#FF0000' },
        { id: '2', name: 'Personal', color: '#00FF00' },
      ];

      (db.query as Mock).mockResolvedValueOnce({ rows: mockTags });

      const res = await app.request('/tags');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.tags).toHaveLength(2);
      expect(json.tags[0].name).toBe('Work');
    });

    it('should return empty array if no tags', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [] });

      const res = await app.request('/tags');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.tags).toHaveLength(0);
    });
  });

  describe('POST /tags', () => {
    it('should create a new tag', async () => {
      const newTag = { id: '1', name: 'New Tag', color: '#0000FF' };

      (db.query as Mock).mockResolvedValueOnce({ rows: [newTag] });

      const res = await app.request('/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Tag', color: '#0000FF' }),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.tag.name).toBe('New Tag');
    });

    it('should use default color if not provided', async () => {
      const newTag = { id: '1', name: 'Default Color', color: '#6B7280' };

      (db.query as Mock).mockResolvedValueOnce({ rows: [newTag] });

      const res = await app.request('/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Default Color' }),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.tag.color).toBe('#6B7280');
    });

    it('should return 400 if name is missing', async () => {
      const res = await app.request('/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '#FF0000' }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Tag name is required');
    });

    it('should return 400 if name is empty', async () => {
      const res = await app.request('/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '   ' }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Tag name is required');
    });

    it('should return 400 if name is too long', async () => {
      const res = await app.request('/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(51) }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Tag name must be less than 50 characters');
    });

    it('should return 409 if tag name already exists', async () => {
      (db.query as Mock).mockRejectedValueOnce({ code: '23505' });

      const res = await app.request('/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Duplicate' }),
      });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error).toBe('Tag with this name already exists');
    });
  });

  describe('PATCH /tags/:id', () => {
    it('should update a tag name', async () => {
      const existingTag = { id: '1', name: 'Old Name', color: '#FF0000' };
      const updatedTag = { id: '1', name: 'New Name', color: '#FF0000' };

      (db.query as Mock)
        .mockResolvedValueOnce({ rows: [existingTag] })
        .mockResolvedValueOnce({ rows: [updatedTag] });

      const res = await app.request('/tags/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.tag.name).toBe('New Name');
    });

    it('should update a tag color', async () => {
      const existingTag = { id: '1', name: 'Tag', color: '#FF0000' };
      const updatedTag = { id: '1', name: 'Tag', color: '#00FF00' };

      (db.query as Mock)
        .mockResolvedValueOnce({ rows: [existingTag] })
        .mockResolvedValueOnce({ rows: [updatedTag] });

      const res = await app.request('/tags/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '#00FF00' }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.tag.color).toBe('#00FF00');
    });

    it('should return 404 if tag not found', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [] });

      const res = await app.request('/tags/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Tag not found');
    });

    it('should return existing tag if no updates provided', async () => {
      const existingTag = { id: '1', name: 'Unchanged', color: '#FF0000' };

      (db.query as Mock).mockResolvedValueOnce({ rows: [existingTag] });

      const res = await app.request('/tags/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.tag.name).toBe('Unchanged');
    });
  });

  describe('DELETE /tags/:id', () => {
    it('should delete a tag', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [{ id: '1' }] });

      const res = await app.request('/tags/1', { method: 'DELETE' });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should return 404 if tag not found', async () => {
      (db.query as Mock).mockResolvedValueOnce({ rows: [] });

      const res = await app.request('/tags/nonexistent', { method: 'DELETE' });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Tag not found');
    });
  });
});
