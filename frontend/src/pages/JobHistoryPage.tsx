import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HistoryTable } from '../components/history/HistoryTable';
import { useJob, useClearJobHistory } from '../hooks/useJobs';
import { useToast } from '../hooks/useToast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useState } from 'react';

export function JobHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id || '');
  const clearHistory = useClearJobHistory();
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  const handleClear = () => {
    if (!id) return;
    clearHistory.mutate(id, {
      onSuccess: () => {
        toast.success('History cleared');
        setConfirmClear(false);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to clear history');
        setConfirmClear(false);
      }
    });
  };

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
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            Clear History
          </Button>
        </div>
      </div>

      {id && <HistoryTable jobId={id} />}

      <ConfirmDialog
        isOpen={confirmClear}
        title="Clear History"
        message="Are you sure you want to clear all execution history for this job? This action cannot be undone."
        confirmLabel="Clear"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
        isLoading={clearHistory.isPending}
      />
    </Layout>
  );
}
