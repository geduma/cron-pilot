import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../plugins/auth.js';
import type { DashboardStats, ApiResponse } from '../types/index.js';

export default async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply auth middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // GET /api/dashboard/stats - Get dashboard statistics
  fastify.get('/api/dashboard/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;

    // Get active and paused jobs count
    const jobsCount = await fastify.db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE enabled = true) as active_jobs,
        COUNT(*) FILTER (WHERE enabled = false) as paused_jobs
       FROM jobs WHERE user_id = $1`,
      [userId]
    );

    // Get total executions
    const executionsCount = await fastify.db.query(
      `SELECT COUNT(*) as total
       FROM job_executions je
       JOIN jobs j ON je.job_id = j.id
       WHERE j.user_id = $1`,
      [userId]
    );

    // Get errors in last 24h
    const errorsCount = await fastify.db.query(
      `SELECT COUNT(*) as total
       FROM job_executions je
       JOIN jobs j ON je.job_id = j.id
       WHERE j.user_id = $1
         AND je.status IN ('FAILED', 'TIMEOUT')
         AND je.executed_at >= NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    // Get last execution
    const lastExecution = await fastify.db.query(
      `SELECT je.executed_at
       FROM job_executions je
       JOIN jobs j ON je.job_id = j.id
       WHERE j.user_id = $1
       ORDER BY je.executed_at DESC
       LIMIT 1`,
      [userId]
    );

    // Get next execution
    const nextExecution = await fastify.db.query(
      `SELECT MIN(next_execution) as next
       FROM jobs
       WHERE user_id = $1 AND enabled = true AND next_execution > NOW()`,
      [userId]
    );

    const stats: DashboardStats = {
      activeJobs: parseInt(jobsCount.rows[0]?.active_jobs || '0'),
      pausedJobs: parseInt(jobsCount.rows[0]?.paused_jobs || '0'),
      totalExecutions: parseInt(executionsCount.rows[0]?.total || '0'),
      errorsLast24h: parseInt(errorsCount.rows[0]?.total || '0'),
      lastExecution: lastExecution.rows[0]?.executed_at?.toISOString() || null,
      nextExecution: nextExecution.rows[0]?.next?.toISOString() || null
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
      message: ''
    };

    return reply.send(response);
  });
}
