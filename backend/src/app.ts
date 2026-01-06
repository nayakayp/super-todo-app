import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => {
  return c.json({ message: 'Super Todo App API' });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export { app };
