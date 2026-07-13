import { StatsCard } from '../ui/Card';
import { useDashboardStats } from '../../hooks/useJobs';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function StatsCards() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = data?.data;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatsCard
        title="Active Jobs"
        value={stats?.activeJobs || 0}
        color="green"
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
        }
      />

      <StatsCard
        title="Paused Jobs"
        value={stats?.pausedJobs || 0}
        color="yellow"
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
          </svg>
        }
      />

      <StatsCard
        title="Total Executions"
        value={stats?.totalExecutions || 0}
        color="blue"
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
        }
      />

      <StatsCard
        title="Errors (24h)"
        value={stats?.errorsLast24h || 0}
        color="red"
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        }
      />

      <StatsCard
        title="Last Execution"
        value={stats?.lastExecution ? new Date(stats.lastExecution).toLocaleTimeString() : '-'}
        color="gray"
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <StatsCard
        title="Next Execution"
        value={stats?.nextExecution ? new Date(stats.nextExecution).toLocaleTimeString() : '-'}
        color="gray"
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        }
      />
    </div>
  );
}
