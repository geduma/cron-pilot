import type { Pool } from 'pg';
import type { Job, JobFrequency } from '../types/index.js';
import { calculateNextExecution } from '../utils/helpers.js';

export class Scheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private db: Pool;
  private isRunning = false;

  constructor(db: Pool) {
    this.db = db;
  }

  start(): void {
    if (this.intervalId) {
      console.log('Scheduler already running');
      return;
    }

    console.log('Starting scheduler...');
    
    // Run immediately on start
    this.run().catch(console.error);

    // Then run every minute
    this.intervalId = setInterval(() => {
      this.run().catch(console.error);
    }, 60000); // 1 minute
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Scheduler stopped');
    }
  }

  private async run(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduler run already in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      // Find jobs that need to be executed
      const result = await this.db.query(
        `SELECT * FROM jobs 
         WHERE enabled = true 
         AND next_execution <= NOW()
         ORDER BY next_execution ASC
         LIMIT 10`
      );

      const jobs = result.rows as Job[];

      if (jobs.length > 0) {
        console.log(`Found ${jobs.length} jobs to execute`);
      }

      // Execute each job
      for (const job of jobs) {
        await this.executeJob(job);
      }
    } catch (error) {
      console.error('Scheduler run error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async executeJob(job: Job): Promise<void> {
    console.log(`Executing job: ${job.name} (${job.id})`);

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

      console.log(`Job ${job.name} completed with status ${status} (${httpStatus})`);
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        status = 'TIMEOUT';
        errorMessage = 'Request timed out after 30 seconds';
      } else {
        status = 'FAILED';
        errorMessage = err.message || 'Unknown error';
      }
      console.log(`Job ${job.name} failed: ${errorMessage}`);
    }

    const durationMs = Date.now() - startTime;

    // Save execution
    await this.db.query(
      `INSERT INTO job_executions (job_id, status, http_status, duration_ms, response_body, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [job.id, status, httpStatus, durationMs, responseBody || null, errorMessage || null]
    );

    // Update job
    const nextExecution = calculateNextExecution(job.frequency, new Date());
    await this.db.query(
      `UPDATE jobs 
       SET last_execution = NOW(), 
           next_execution = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [nextExecution, job.id]
    );
  }
}
