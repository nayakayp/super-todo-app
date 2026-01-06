import { vi } from 'vitest';

// Mock the database module
vi.mock('../db', () => ({
  db: {
    query: vi.fn(),
    getClient: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn(),
    })),
    end: vi.fn(),
  },
}));

// Set environment variables for tests
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.SESSION_SECRET = 'test-secret';
