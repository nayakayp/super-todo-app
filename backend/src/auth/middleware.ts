import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { db } from '../db';
import { authConfig } from './config';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    userId: string;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, authConfig.sessionCookieName);

  if (!token) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const result = await db.query(
    `SELECT u.id, u.email, u.name FROM users u
     JOIN sessions s ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    return c.json({ error: 'Session expired' }, 401);
  }

  const user = result.rows[0] as AuthUser;
  c.set('user', user);
  c.set('userId', user.id);
  await next();
}

// Alias for route-level middleware usage
export const requireAuth = authMiddleware;
