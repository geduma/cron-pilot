import type { JobFrequency } from '../types';

export const FREQUENCY_OPTIONS: { value: JobFrequency; label: string }[] = [
  { value: '1m', label: 'Every 1 minute' },
  { value: '5m', label: 'Every 5 minutes' },
  { value: '10m', label: 'Every 10 minutes' },
  { value: '15m', label: 'Every 15 minutes' },
  { value: '30m', label: 'Every 30 minutes' },
  { value: '1h', label: 'Every 1 hour' },
  { value: '6h', label: 'Every 6 hours' },
  { value: '12h', label: 'Every 12 hours' },
  { value: '24h', label: 'Every 24 hours' }
];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getFrequencyLabel(frequency: JobFrequency): string {
  const option = FREQUENCY_OPTIONS.find((opt) => opt.value === frequency);
  return option?.label || frequency;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'SUCCESS':
      return 'bg-green-100 text-green-800';
    case 'PAUSED':
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'TIMEOUT':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
