import axios from 'axios';
import type { ApiResponse, Job, JobExecution, DashboardStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const { data } = await api.get('/api/dashboard/stats');
    return data;
  }
};

export const jobsApi = {
  getAll: async (): Promise<ApiResponse<Job[]>> => {
    const { data } = await api.get('/api/jobs');
    return data;
  },

  getById: async (id: string): Promise<ApiResponse<Job>> => {
    const { data } = await api.get(`/api/jobs/${id}`);
    return data;
  },

  create: async (job: Partial<Job>): Promise<ApiResponse<Job>> => {
    const { data } = await api.post('/api/jobs', job);
    return data;
  },

  update: async (id: string, job: Partial<Job>): Promise<ApiResponse<Job>> => {
    const { data } = await api.put(`/api/jobs/${id}`, job);
    return data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/api/jobs/${id}`);
    return data;
  },

  run: async (id: string): Promise<ApiResponse<{ executionId: string; status: string; httpStatus: number; durationMs: number }>> => {
    const { data } = await api.post(`/api/jobs/${id}/run`);
    return data;
  },

  getHistory: async (id: string, params?: { limit?: number; offset?: number; filter?: string }): Promise<ApiResponse<JobExecution[]>> => {
    const { data } = await api.get(`/api/jobs/${id}/history`, { params });
    return data;
  }
};

export default api;
