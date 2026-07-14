import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase } from './plugins/db.js';
import jobsRoutes from './routes/jobs.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import { Scheduler } from './services/scheduler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
});

// CORS
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? true // Allow all origins in production
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
});

// Serve frontend static files
const frontendDistPath = path.join(__dirname, '../frontend/dist');

await fastify.register(fastifyStatic, {
  root: frontendDistPath,
  prefix: '/',
  decorateReply: true
});

// API routes
await fastify.register(authRoutes);
await fastify.register(jobsRoutes);
await fastify.register(dashboardRoutes);

// Catch-all route for SPA - serve index.html for non-API routes
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
    return reply.status(404).send({
      success: false,
      message: 'API endpoint not found'
    });
  }

  return reply.sendFile('index.html');
});

// Start server
async function start() {
  try {
    // Initialize database
    const db = initDatabase();
    fastify.decorate('db', db);

    // Start scheduler
    const scheduler = new Scheduler(fastify.db);
    scheduler.start();

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`Server running on http://${host}:${port}`);
    console.log(`Frontend served from: ${frontendDistPath}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await fastify.close();
  closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await fastify.close();
  closeDatabase();
  process.exit(0);
});

start();
