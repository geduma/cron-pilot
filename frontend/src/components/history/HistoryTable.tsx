import { useState } from 'react';
import { useJobHistory } from '../../hooks/useJobs';
import { StatusBadge } from '../ui/StatusBadge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatDate, formatDuration } from '../../utils/helpers';
import { Button } from '../ui/Button';

interface HistoryTableProps {
  jobId: string;
}

export function HistoryTable({ jobId }: HistoryTableProps) {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading } = useJobHistory(jobId, {
    limit,
    offset: page * limit,
    filter
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const executions = data?.data || [];

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          size="sm"
          variant={!filter ? 'primary' : 'secondary'}
          onClick={() => { setFilter(undefined); setPage(0); }}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filter === '24h' ? 'primary' : 'secondary'}
          onClick={() => { setFilter('24h'); setPage(0); }}
        >
          Last 24h
        </Button>
        <Button
          size="sm"
          variant={filter === '7d' ? 'primary' : 'secondary'}
          onClick={() => { setFilter('7d'); setPage(0); }}
        >
          Last 7 days
        </Button>
        <Button
          size="sm"
          variant={filter === '30d' ? 'primary' : 'secondary'}
          onClick={() => { setFilter('30d'); setPage(0); }}
        >
          Last 30 days
        </Button>
      </div>

      {executions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No executions found
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HTTP Status
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.map((execution) => {
                  const isExpanded = expandedId === execution.id;
                  const hasBody = !!execution.responseBody;

                  return (
                    <>
                      <tr
                        key={execution.id}
                        className={`hover:bg-gray-50 ${hasBody ? 'cursor-pointer' : ''}`}
                        onClick={() => hasBody && toggleRow(execution.id)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {hasBody && (
                            <svg
                              className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(execution.executedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={execution.status} size="sm" />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {execution.httpStatus || '-'}
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(execution.durationMs)}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-4 text-sm text-red-600 max-w-xs truncate">
                          {execution.errorMessage || '-'}
                        </td>
                      </tr>
                      {isExpanded && hasBody && (
                        <tr key={`${execution.id}-expanded`}>
                          <td colSpan={6} className="px-4 py-4 bg-gray-50">
                            <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                              Response Body
                            </div>
                            <pre className="text-sm text-gray-900 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
                              {execution.responseBody}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {executions.length === limit && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
