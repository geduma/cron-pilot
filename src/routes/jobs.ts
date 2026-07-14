import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../plugins/auth.js';
import type { CreateJobRequest, UpdateJobRequest, Job, ApiResponse } from '../types/index.js';
import { calculateNextExecution, generateUUID } from '../utils/helpers.js';
import { mapRowToCamel, mapRowsToCamel } from '../utils/mappers.js';

interface JobParams {
  id: string;
}

interface HistoryQuery {
  limit?: number;
  offset?: number;
  filter?: string;
}

export default async function jobsRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply auth middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // GET /api/jobs - List all jobs for user
  fastify.get('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;

    const stmt = fastify.db.prepare(
      'SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC'
    );
    const rows = stmt.all(userId);
    const jobs = mapRowsToCamel<Job>(rows as Record<string, unknown>[]);

    const response: ApiResponse<Job[]> = {
      success: true,
      data: jobs,
      message: ''
    };

    return reply.send(response);
  });

  // POST /api/jobs/test - Test run without saving
  fastify.post('/api/jobs/test', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateJobRequest;

    if (!body.url || !body.method) {
      return reply.status(400).send({
        success: false,
        message: 'url and method are required'
      });
    }

    if (body.expectedStatus && (body.expectedStatus < 100 || body.expectedStatus > 599)) {
      return reply.status(400).send({
        success: false,
        message: 'expectedStatus must be between 100 and 599'
      });
    }

    const startTime = Date.now();
    let httpStatus = 0;
    let responseBody = '';
    let errorMessage = '';
    let status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' = 'SUCCESS';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const headers: Record<string, string> = body.headers || {};

      const fetchOptions: RequestInit = {
        method: body.method,
        headers,
        signal: controller.signal
      };

      if (['POST', 'PUT', 'PATCH'].includes(body.method) && body.body) {
        fetchOptions.body = body.body;
      }

      const response = await fetch(body.url, fetchOptions);
      clearTimeout(timeoutId);

      httpStatus = response.status;
      responseBody = await response.text();

      const expected = body.expectedStatus || 200;
      if (httpStatus !== expected) {
        status = 'FAILED';
        errorMessage = `Expected status ${expected}, got ${httpStatus}`;
      }
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        status = 'TIMEOUT';
        errorMessage = 'Request timed out after 30 seconds';
      } else {
        status = 'FAILED';
        errorMessage = err.message || 'Unknown error';
      }
    }

    const durationMs = Date.now() - startTime;

    const response = {
      success: true,
      data: {
        status,
        httpStatus,
        durationMs,
        responseBody: responseBody.substring(0, 1000),
        error: errorMessage || undefined
      },
      message: status === 'SUCCESS' ? 'Test passed' : 'Test failed'
    };

    return reply.send(response);
  });

  // POST /api/jobs - Create new job
  fastify.post('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const body = request.body as CreateJobRequest;

    // Validation
    if (!body.name || !body.url || !body.method || !body.frequency) {
      return reply.status(400).send({
        success: false,
        message: 'Missing required fields: name, url, method, frequency'
      });
    }

    if (body.expectedStatus && (body.expectedStatus < 100 || body.expectedStatus > 599)) {
      return reply.status(400).send({
        success: false,
        message: 'expectedStatus must be between 100 and 599'
      });
    }

    const nextExecution = calculateNextExecution(body.frequency).toISOString();
    const id = generateUUID();

    const stmt = fastify.db.prepare(
      `INSERT INTO jobs (id, user_id, name, description, method, url, headers, body, expected_status, frequency, enabled, next_execution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    stmt.run(
      id,
      userId,
      body.name,
      body.description || null,
      body.method,
      body.url,
      JSON.stringify(body.headers || {}),
      body.body || null,
      body.expectedStatus || 200,
      body.frequency,
      body.enabled !== false ? 1 : 0,
      nextExecution
    );

    const created = fastify.db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    const job = mapRowToCamel<Job>(created as Record<string, unknown>);

    const response: ApiResponse<Job> = {
      success: true,
      data: job,
      message: 'Job created'
    };

    return reply.status(201).send(response);
  });

  // GET /api/jobs/:id - Get job details
  fastify.get<{ Params: JobParams }>('/api/jobs/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;

    const stmt = fastify.db.prepare(
      'SELECT * FROM jobs WHERE id = ? AND user_id = ?'
    );
    const row = stmt.get(id, userId);

    if (!row) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    const job = mapRowToCamel<Job>(row as Record<string, unknown>);

    const response: ApiResponse<Job> = {
      success: true,
      data: job,
      message: ''
    };

    return reply.send(response);
  });

  // PUT /api/jobs/:id - Update job
  fastify.put<{ Params: JobParams; Body: UpdateJobRequest }>('/api/jobs/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;
    const body = request.body;

    // Check if job exists
    const existing = fastify.db.prepare(
      'SELECT * FROM jobs WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!existing) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.method !== undefined) {
      updates.push('method = ?');
      values.push(body.method);
    }
    if (body.url !== undefined) {
      updates.push('url = ?');
      values.push(body.url);
    }
    if (body.headers !== undefined) {
      updates.push('headers = ?');
      values.push(JSON.stringify(body.headers));
    }
    if (body.body !== undefined) {
      updates.push('body = ?');
      values.push(body.body);
    }
    if (body.expectedStatus !== undefined) {
      updates.push('expected_status = ?');
      values.push(body.expectedStatus);
    }
    if (body.frequency !== undefined) {
      updates.push('frequency = ?');
      values.push(body.frequency);
      // Recalculate next execution if frequency changed
      const nextExecution = calculateNextExecution(body.frequency, new Date()).toISOString();
      updates.push('next_execution = ?');
      values.push(nextExecution);
    }
    if (body.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(body.enabled ? 1 : 0);
    }

    updates.push("updated_at = datetime('now')");

    if (updates.length === 1) {
      // Only updated_at, nothing to update
      const job = mapRowToCamel<Job>(existing as Record<string, unknown>);
      const response: ApiResponse<Job> = {
        success: true,
        data: job,
        message: 'Job unchanged'
      };
      return reply.send(response);
    }

    values.push(id, userId);

    fastify.db.prepare(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...values);

    const updated = fastify.db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    const job = mapRowToCamel<Job>(updated as Record<string, unknown>);

    const response: ApiResponse<Job> = {
      success: true,
      data: job,
      message: 'Job updated'
    };

    return reply.send(response);
  });

  // DELETE /api/jobs/:id - Delete job
  fastify.delete<{ Params: JobParams }>('/api/jobs/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;

    const result = fastify.db.prepare(
      'DELETE FROM jobs WHERE id = ? AND user_id = ?'
    ).run(id, userId);

    if (result.changes === 0) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Job deleted'
    };

    return reply.send(response);
  });

  // POST /api/jobs/:id/run - Execute job manually
  fastify.post<{ Params: JobParams }>('/api/jobs/:id/run', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;

    const row = fastify.db.prepare(
      'SELECT * FROM jobs WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!row) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    const job = mapRowToCamel<Job>(row as Record<string, unknown>);

    // Execute the job
    const startTime = Date.now();
    let httpStatus = 0;
    let responseBody = '';
    let errorMessage = '';
    let status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' = 'SUCCESS';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const headers: Record<string, string> = typeof job.headers === 'string'
        ? JSON.parse(job.headers)
        : job.headers || {};

      const fetchOptions: RequestInit = {
        method: job.method,
        headers,
        signal: controller.signal
      };

      if (['POST', 'PUT', 'PATCH'].includes(job.method) && job.body) {
        fetchOptions.body = job.body;
      }

      const response = await fetch(job.url, fetchOptions);
      clearTimeout(timeoutId);

      httpStatus = response.status;
      responseBody = await response.text();

      if (httpStatus !== job.expectedStatus) {
        status = 'FAILED';
        errorMessage = `Expected status ${job.expectedStatus}, got ${httpStatus}`;
      }
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        status = 'TIMEOUT';
        errorMessage = 'Request timed out after 30 seconds';
      } else {
        status = 'FAILED';
        errorMessage = err.message || 'Unknown error';
      }
    }

    const durationMs = Date.now() - startTime;
    const executionId = generateUUID();

    // Save execution
    fastify.db.prepare(
      `INSERT INTO job_executions (id, job_id, status, http_status, duration_ms, response_body, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(executionId, id, status, httpStatus, durationMs, responseBody || null, errorMessage || null);

    // Update job last_execution
    fastify.db.prepare(
      "UPDATE jobs SET last_execution = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(id);

    const response = {
      success: true,
      data: {
        executionId,
        status,
        httpStatus,
        durationMs,
        error: errorMessage || undefined
      },
      message: status === 'SUCCESS' ? 'Job executed' : 'Job executed with error'
    };

    return reply.send(response);
  });

  // GET /api/jobs/:id/history - Get job execution history
  fastify.get<{ Params: JobParams; Querystring: HistoryQuery }>('/api/jobs/:id/history', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;
    const { limit = 50, offset = 0, filter } = request.query;

    // Verify job belongs to user
    const jobCheck = fastify.db.prepare(
      'SELECT id FROM jobs WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!jobCheck) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    let query = 'SELECT * FROM job_executions WHERE job_id = ?';
    const params: unknown[] = [id];

    if (filter) {
      let interval: string;
      switch (filter) {
        case '24h':
          interval = '24 hours';
          break;
        case '7d':
          interval = '7 days';
          break;
        case '30d':
          interval = '30 days';
          break;
        default:
          interval = '24 hours';
      }
      query += ` AND executed_at >= datetime('now', '-${interval}')`;
    }

    query += ' ORDER BY executed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = fastify.db.prepare(query).all(...params);
    const executions = mapRowsToCamel(rows as Record<string, unknown>[]);

    const response = {
      success: true,
      data: executions,
      message: ''
    };

    return reply.send(response);
  });

  // DELETE /api/jobs/:id/history - Clear job execution history
  fastify.delete<{ Params: JobParams }>('/api/jobs/:id/history', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;

    const jobCheck = fastify.db.prepare(
      'SELECT id FROM jobs WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!jobCheck) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    const result = fastify.db.prepare(
      'DELETE FROM job_executions WHERE job_id = ?'
    ).run(id);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: `Cleared ${result.changes} execution(s)`
    };

    return reply.send(response);
  });
}
