export interface User {
  email: string;
  displayName: string;
  picture: string;
  provider: string;
  allowed: boolean;
}

export interface Session {
  ok: boolean;
  msg: string;
  data: User;
}

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
  lastExecution: string | null;
  nextExecution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobExecution {
  id: string;
  jobId: string;
  status: ExecutionStatus;
  httpStatus: number | null;
  durationMs: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  executedAt: string;
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

export interface ApiError {
  success: false;
  message: string;
}

export interface Provider {
  providerId: string;
  name: string;
  displayName: string;
  icon: string;
}

export interface ProvidersResponse {
  ok: boolean;
  msg: string;
  data: Provider[];
}

export interface LoginResponse {
  ok: boolean;
  msg: string;
  data: {
    redirect: string;
  };
}

export interface SessionResponse {
  ok: boolean;
  msg: string;
  data: User;
}
