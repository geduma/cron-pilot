import type { JobFrequency } from '../types/index.js';

export const FREQUENCIES: Record<JobFrequency, number> = {
  '1m': 1 * 60 * 1000,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000
};

export function calculateNextExecution(frequency: JobFrequency, lastExecution?: Date | null): Date {
  const now = new Date();
  const base = lastExecution || now;
  const interval = FREQUENCIES[frequency];
  return new Date(base.getTime() + interval);
}

export function getFrequencyMs(frequency: JobFrequency): number {
  return FREQUENCIES[frequency];
}
