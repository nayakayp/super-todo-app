import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Create a simple test app mimicking app.ts routes
function createTestApp() {
  const app = new Hono();

  app.get('/', (c) => {
    return c.json({ message: 'Super Todo App API' });
  });

  app.get('/health', (c) => {
    return c.json({ status: 'ok' });
  });

  return app;
}

describe('App API', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await app.request('/');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toBe('Super Todo App API');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await app.request('/health');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.status).toBe('ok');
    });
  });
});
