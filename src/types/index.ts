export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type JobFrequency = '1m' | '5m' | '10m' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';

export type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface Job {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  expectedStatus: number;
  frequency: JobFrequency;
  enabled: boolean;
  lastExecution: Date | null;
  nextExecution: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobExecution {
  id: string;
  jobId: string;
  status: ExecutionStatus;
  httpStatus: number | null;
  durationMs: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  executedAt: Date;
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
