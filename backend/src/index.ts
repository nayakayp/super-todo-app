import { serve } from '@hono/node-server';
import { app } from './app';
import { runMigrations } from './db/migrations/index';

const port = Number(process.env.PORT) || 4000;

async function start() {
  await runMigrations();
  console.log(`Server is running on http://localhost:${port}`);

  serve({
    fetch: app.fetch,
    port,
  });
}

start().catch(console.error);
