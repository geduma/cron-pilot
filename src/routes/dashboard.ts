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
    const jobsCount = fastify.db.prepare(
      `SELECT
        COUNT(CASE WHEN enabled = 1 THEN 1 END) as active_jobs,
        COUNT(CASE WHEN enabled = 0 THEN 1 END) as paused_jobs
       FROM jobs WHERE user_id = ?`
    ).get(userId) as { active_jobs: number; paused_jobs: number };

    // Get total executions
    const executionsCount = fastify.db.prepare(
      `SELECT COUNT(*) as total
       FROM job_executions je
       JOIN jobs j ON je.job_id = j.id
       WHERE j.user_id = ?`
    ).get(userId) as { total: number };

    // Get errors in last 24h
    const errorsCount = fastify.db.prepare(
      `SELECT COUNT(*) as total
       FROM job_executions je
       JOIN jobs j ON je.job_id = j.id
       WHERE j.user_id = ?
         AND je.status IN ('FAILED', 'TIMEOUT')
         AND je.executed_at >= datetime('now', '-24 hours')`
    ).get(userId) as { total: number };

    // Get last execution
    const lastExecution = fastify.db.prepare(
      `SELECT je.executed_at
       FROM job_executions je
       JOIN jobs j ON je.job_id = j.id
       WHERE j.user_id = ?
       ORDER BY je.executed_at DESC
       LIMIT 1`
    ).get(userId) as { executed_at: string } | undefined;

    // Get next execution
    const nextExecution = fastify.db.prepare(
      `SELECT MIN(next_execution) as next
       FROM jobs
       WHERE user_id = ? AND enabled = 1 AND next_execution > datetime('now')`
    ).get(userId) as { next: string } | undefined;

    const stats: DashboardStats = {
      activeJobs: jobsCount?.active_jobs || 0,
      pausedJobs: jobsCount?.paused_jobs || 0,
      totalExecutions: executionsCount?.total || 0,
      errorsLast24h: errorsCount?.total || 0,
      lastExecution: lastExecution?.executed_at || null,
      nextExecution: nextExecution?.next || null
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
      message: ''
    };

    return reply.send(response);
  });
}
