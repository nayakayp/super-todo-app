import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500
  );
}
