import { initDatabase, closeDatabase } from '../plugins/db.js';

const migrations = `
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  method TEXT NOT NULL CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  url TEXT NOT NULL,
  headers TEXT DEFAULT '{}',
  body TEXT,
  expected_status INTEGER DEFAULT 200,
  frequency TEXT NOT NULL CHECK (frequency IN ('1m','5m','10m','15m','30m','1h','6h','12h','24h')),
  enabled INTEGER DEFAULT 1,
  last_execution TEXT,
  next_execution TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_executions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS','FAILED','TIMEOUT')),
  http_status INTEGER,
  duration_ms INTEGER,
  response_body TEXT,
  error_message TEXT,
  executed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_next_execution ON jobs(next_execution) WHERE enabled = 1;
CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON job_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_executed_at ON job_executions(executed_at DESC);
`;

async function migrate() {
  console.log('Running migrations...');
  const db = initDatabase();

  try {
    db.exec(migrations);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

migrate();
