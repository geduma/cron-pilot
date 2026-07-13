import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, jobsApi } from '../services/api';
import type { Job, JobFrequency, HttpMethod } from '../types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 30000
  });
}

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.getAll(),
    refetchInterval: 10000
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsApi.getById(id),
    enabled: !!id
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (job: {
      name: string;
      description?: string;
      method: HttpMethod;
      url: string;
      headers?: Record<string, string>;
      body?: string;
      expectedStatus: number;
      frequency: JobFrequency;
      enabled: boolean;
    }) => jobsApi.create(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, job }: { id: string; job: Partial<Job> }) =>
      jobsApi.update(id, job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
}

export function useRunJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsApi.run(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
}

export function useJobHistory(id: string, params?: { limit?: number; offset?: number; filter?: string }) {
  return useQuery({
    queryKey: ['jobs', id, 'history', params],
    queryFn: () => jobsApi.getHistory(id, params),
    enabled: !!id
  });
}
