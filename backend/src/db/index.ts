import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end(),
};

export type DbClient = typeof db;
