import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './auth/routes';
import { todosRoutes } from './todos/routes';
import { tagsRoutes } from './tags/routes';
import { errorHandler } from './middleware/errorHandler';

const app = new Hono();

app.onError(errorHandler);

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({ message: 'Super Todo App API' });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.route('/api/auth', authRoutes);
app.route('/api/todos', todosRoutes);
app.route('/api/tags', tagsRoutes);

export { app };
