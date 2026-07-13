export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type JobFrequency = '1m' | '5m' | '10m' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';

export type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface Job {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  expected_status: number;
  frequency: JobFrequency;
  enabled: boolean;
  last_execution: Date | null;
  next_execution: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface JobExecution {
  id: string;
  job_id: string;
  status: ExecutionStatus;
  http_status: number | null;
  duration_ms: number | null;
  response_body: string | null;
  error_message: string | null;
  executed_at: Date;
}

export interface DashboardStats {
  activeJobs: number;
  pausedJobs: number;
  totalExecutions: number;
  errorsLast24h: number;
  lastExecution: string | null;
  nextExecution: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface GedumaUser {
  email: string;
  displayName: string;
  picture: string;
  provider: string;
  allowed: boolean;
}

export interface GedumaSessionResponse {
  ok: boolean;
  msg: string;
  data: GedumaUser;
}

export interface CreateJobRequest {
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  expectedStatus: number;
  frequency: JobFrequency;
  enabled: boolean;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {}
