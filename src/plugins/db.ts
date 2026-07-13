import pg from 'pg';
import type { FastifyInstance } from 'fastify';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export async function initDatabase(): Promise<pg.Pool> {
  if (pool) return pool;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  // Test connection
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('Database connected successfully');
  } finally {
    client.release();
  }

  return pool;
}

export function getPool(): pg.Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function dbPlugin(fastify: FastifyInstance): Promise<void> {
  const db = await initDatabase();
  
  fastify.decorate('db', db);
  
  fastify.addHook('onClose', async () => {
    await closeDatabase();
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    db: pg.Pool;
  }
}
