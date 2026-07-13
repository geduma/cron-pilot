import { Layout } from '../components/layout/Layout';
import { StatsCards } from '../components/dashboard/StatsCards';
import { JobsTable } from '../components/dashboard/JobsTable';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your scheduled jobs
          </p>
        </div>
        <Link to="/jobs/new" className="mt-4 sm:mt-0">
          <Button>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Job
          </Button>
        </Link>
      </div>

      <StatsCards />
      <JobsTable />
    </Layout>
  );
}
