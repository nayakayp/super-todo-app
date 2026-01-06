import { config } from '../config';
import { createHash, randomBytes } from 'crypto';

export const authConfig = {
  sessionCookieName: 'super_todo_session',
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt + config.jwtSecret).digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const computedHash = createHash('sha256').update(password + salt + config.jwtSecret).digest('hex');
  return hash === computedHash;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
