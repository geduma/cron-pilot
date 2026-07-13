import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../plugins/auth.js';
import type { CreateJobRequest, UpdateJobRequest, Job, ApiResponse } from '../types/index.js';
import { calculateNextExecution } from '../utils/helpers.js';

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

    const result = await fastify.db.query(
      'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const response: ApiResponse<Job[]> = {
      success: true,
      data: result.rows,
      message: ''
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

    const nextExecution = calculateNextExecution(body.frequency);

    const result = await fastify.db.query(
      `INSERT INTO jobs (user_id, name, description, method, url, headers, body, expected_status, frequency, enabled, next_execution)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        body.name,
        body.description || null,
        body.method,
        body.url,
        JSON.stringify(body.headers || {}),
        body.body || null,
        body.expectedStatus || 200,
        body.frequency,
        body.enabled !== false,
        nextExecution
      ]
    );

    const response: ApiResponse<Job> = {
      success: true,
      data: result.rows[0],
      message: 'Job created'
    };

    return reply.status(201).send(response);
  });

  // GET /api/jobs/:id - Get job details
  fastify.get<{ Params: JobParams }>('/api/jobs/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;

    const result = await fastify.db.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    const response: ApiResponse<Job> = {
      success: true,
      data: result.rows[0],
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
    const existing = await fastify.db.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    const existingJob = existing.rows[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }
    if (body.method !== undefined) {
      updates.push(`method = $${paramIndex++}`);
      values.push(body.method);
    }
    if (body.url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(body.url);
    }
    if (body.headers !== undefined) {
      updates.push(`headers = $${paramIndex++}`);
      values.push(JSON.stringify(body.headers));
    }
    if (body.body !== undefined) {
      updates.push(`body = $${paramIndex++}`);
      values.push(body.body);
    }
    if (body.expectedStatus !== undefined) {
      updates.push(`expected_status = $${paramIndex++}`);
      values.push(body.expectedStatus);
    }
    if (body.frequency !== undefined) {
      updates.push(`frequency = $${paramIndex++}`);
      values.push(body.frequency);
      // Recalculate next execution if frequency changed
      const newFrequency = body.frequency || existingJob.frequency;
      const nextExecution = calculateNextExecution(newFrequency, new Date());
      updates.push(`next_execution = $${paramIndex++}`);
      values.push(nextExecution);
    }
    if (body.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(body.enabled);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at, nothing to update
      const response: ApiResponse<Job> = {
        success: true,
        data: existingJob,
        message: 'Job unchanged'
      };
      return reply.send(response);
    }

    values.push(id, userId);

    const result = await fastify.db.query(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
      values
    );

    const response: ApiResponse<Job> = {
      success: true,
      data: result.rows[0],
      message: 'Job updated'
    };

    return reply.send(response);
  });

  // DELETE /api/jobs/:id - Delete job
  fastify.delete<{ Params: JobParams }>('/api/jobs/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;

    const result = await fastify.db.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
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

    const result = await fastify.db.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    const job = result.rows[0];

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

      if (httpStatus !== job.expected_status) {
        status = 'FAILED';
        errorMessage = `Expected status ${job.expected_status}, got ${httpStatus}`;
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

    // Save execution
    const executionResult = await fastify.db.query(
      `INSERT INTO job_executions (job_id, status, http_status, duration_ms, response_body, error_message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, status, httpStatus, durationMs, responseBody || null, errorMessage || null]
    );

    // Update job last_execution
    await fastify.db.query(
      'UPDATE jobs SET last_execution = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    );

    const response = {
      success: true,
      data: {
        executionId: executionResult.rows[0].id,
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
    const jobCheck = await fastify.db.query(
      'SELECT id FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (jobCheck.rows.length === 0) {
      return reply.status(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    let query = 'SELECT * FROM job_executions WHERE job_id = $1';
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
      query += ` AND executed_at >= NOW() - INTERVAL '${interval}'`;
    }

    query += ' ORDER BY executed_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await fastify.db.query(query, params);

    const response = {
      success: true,
      data: result.rows,
      message: ''
    };

    return reply.send(response);
  });
}
