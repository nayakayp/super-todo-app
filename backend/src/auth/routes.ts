import { Hono } from 'hono';
import { db } from '../db';
import { hashPassword, verifyPassword, generateSessionToken, authConfig } from './config';
import { setCookie, deleteCookie } from 'hono/cookie';

export const authRoutes = new Hono();

authRoutes.post('/sign-up', async (c) => {
  const { email, password, name } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  // Check if user exists
  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    return c.json({ error: 'User already exists' }, 409);
  }

  const passwordHash = hashPassword(password);
  const result = await db.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, passwordHash, name || null]
  );

  const user = result.rows[0];
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + authConfig.sessionMaxAge);

  await db.query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt]
  );

  setCookie(c, authConfig.sessionCookieName, token, {
    ...authConfig.cookieOptions,
    maxAge: authConfig.sessionMaxAge / 1000,
  });

  return c.json({ user: { id: user.id, email: user.email, name: user.name } }, 201);
});

authRoutes.post('/sign-in', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const result = await db.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const user = result.rows[0];
  if (!verifyPassword(password, user.password_hash)) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + authConfig.sessionMaxAge);

  await db.query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt]
  );

  setCookie(c, authConfig.sessionCookieName, token, {
    ...authConfig.cookieOptions,
    maxAge: authConfig.sessionMaxAge / 1000,
  });

  return c.json({ user: { id: user.id, email: user.email, name: user.name } });
});

authRoutes.post('/sign-out', async (c) => {
  const { getCookie } = await import('hono/cookie');
  const token = getCookie(c, authConfig.sessionCookieName);

  if (token) {
    await db.query('DELETE FROM sessions WHERE token = $1', [token]);
    deleteCookie(c, authConfig.sessionCookieName);
  }

  return c.json({ success: true });
});

authRoutes.get('/me', async (c) => {
  const { getCookie } = await import('hono/cookie');
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

  return c.json({ user: result.rows[0] });
});
