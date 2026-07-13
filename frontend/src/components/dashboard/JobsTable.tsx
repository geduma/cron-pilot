import { Link } from 'react-router-dom';
import { useJobs, useRunJob, useDeleteJob } from '../../hooks/useJobs';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatDate, getFrequencyLabel } from '../../utils/helpers';
import { useState } from 'react';
import type { Job } from '../../types';

export function JobsTable() {
  const { data, isLoading } = useJobs();
  const runJob = useRunJob();
  const deleteJob = useDeleteJob();
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const jobs = data?.data || [];

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No jobs</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new job.</p>
        <div className="mt-6">
          <Link to="/jobs/new">
            <Button>New Job</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRun = (job: Job) => {
    runJob.mutate(job.id);
  };

  const handleDelete = () => {
    if (jobToDelete) {
      deleteJob.mutate(jobToDelete.id, {
        onSuccess: () => setJobToDelete(null)
      });
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Execution
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Execution
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link
                      to={`/jobs/${job.id}/history`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {job.name}
                    </Link>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{job.url}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status={job.enabled ? 'ACTIVE' : 'PAUSED'} />
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{job.method}</span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{getFrequencyLabel(job.frequency)}</span>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.lastExecution)}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.nextExecution)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRun(job)}
                      disabled={runJob.isPending}
                    >
                      Run
                    </Button>
                    <Link to={`/jobs/${job.id}/edit`}>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setJobToDelete(job)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!jobToDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${jobToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setJobToDelete(null)}
        isLoading={deleteJob.isPending}
      />
    </>
  );
}
