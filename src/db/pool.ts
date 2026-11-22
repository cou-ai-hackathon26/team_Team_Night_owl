import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  return pool;
}

export async function initDbTables() {
  const db = getDbPool();
  if (!db) return;

  try {
    // 1. Reports Table with total_reports column
    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id BIGSERIAL PRIMARY KEY,
        kind TEXT NOT NULL,
        value_normalized TEXT NOT NULL,
        category TEXT,
        note_masked TEXT,
        reporter_hash TEXT,
        status TEXT NOT NULL DEFAULT 'accepted',
        total_reports INT DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_kind_value_normalized_reporter_hash_key;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS total_reports INT DEFAULT 1;
      CREATE INDEX IF NOT EXISTS idx_reports_val ON reports (value_normalized);
    `);
  } catch (err) {
    console.error('Error initializing DB tables:', err);
  }
}
