import { Pool } from 'pg';

async function migrateAddendum() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('No DATABASE_URL found. Skipping remote migration.');
    process.exit(0);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database for Addendum migration...');

    // 1. Ensure analysis_events table exists per main spec 8.1
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analysis_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        input_kind TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        score INT NOT NULL,
        signal_ids TEXT[] NOT NULL,
        degraded JSONB NOT NULL,
        latency_ms INT NOT NULL
      );
    `);

    // 2. Add addendum columns (Spec 4.2)
    await pool.query(`
      ALTER TABLE analysis_events ADD COLUMN IF NOT EXISTS scam_type TEXT;
      ALTER TABLE analysis_events ADD COLUMN IF NOT EXISTS brand TEXT;
      CREATE INDEX IF NOT EXISTS analysis_events_created_idx ON analysis_events (created_at);
    `);

    console.log('✅ Addendum migration completed successfully.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    await pool.end();
    process.exit(1);
  }
}

migrateAddendum();
