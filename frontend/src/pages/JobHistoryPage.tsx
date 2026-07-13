import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HistoryTable } from '../components/history/HistoryTable';
import { useJob } from '../hooks/useJobs';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';

export function JobHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id || '');

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/jobs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to Jobs
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {job?.data?.name || 'Job History'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Execution history for this job
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Link to={`/jobs/${id}/edit`}>
            <Button variant="secondary">Edit Job</Button>
          </Link>
        </div>
      </div>

      {id && <HistoryTable jobId={id} />}
    </Layout>
  );
}
