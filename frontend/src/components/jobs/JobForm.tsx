import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateJob, useUpdateJob, useJob, useTestRunJob } from '../../hooks/useJobs';
import { useToast } from '../../hooks/useToast';
import { FREQUENCY_OPTIONS, HTTP_METHODS } from '../../utils/helpers';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { HttpMethod, JobFrequency } from '../../types';

interface JobFormProps {
  jobId?: string;
}

export function JobForm({ jobId }: JobFormProps) {
  const navigate = useNavigate();
  const isEditing = !!jobId;

  const { data: existingJob, isLoading: isLoadingJob } = useJob(jobId || '');
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const testRun = useTestRunJob();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [expectedStatus, setExpectedStatus] = useState('200');
  const [frequency, setFrequency] = useState<JobFrequency>('5m');
  const [enabled, setEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingJob?.data) {
      const job = existingJob.data;
      setName(job.name);
      setDescription(job.description || '');
      setMethod(job.method);
      setUrl(job.url);
      setHeaders(typeof job.headers === 'string' ? job.headers : JSON.stringify(job.headers, null, 2));
      setBody(job.body || '');
      setExpectedStatus(String(job.expectedStatus));
      setFrequency(job.frequency);
      setEnabled(job.enabled);
    }
  }, [existingJob]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(url);
      } catch {
        newErrors.url = 'Invalid URL';
      }
    }

    if (!expectedStatus) {
      newErrors.expectedStatus = 'Expected status is required';
    } else {
      const status = parseInt(expectedStatus);
      if (isNaN(status) || status < 100 || status > 599) {
        newErrors.expectedStatus = 'Status must be between 100 and 599';
      }
    }

    if (headers) {
      try {
        JSON.parse(headers);
      } catch {
        newErrors.headers = 'Invalid JSON';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const jobData = {
      name: name.trim(),
      description: description.trim() || undefined,
      method,
      url: url.trim(),
      headers: headers ? JSON.parse(headers) : {},
      body: body.trim() || undefined,
      expectedStatus: parseInt(expectedStatus),
      frequency,
      enabled
    };

    if (isEditing && jobId) {
      updateJob.mutate(
        { id: jobId, job: jobData },
        {
          onSuccess: () => {
            toast.success('Job updated successfully');
            navigate('/jobs');
          },
          onError: (error: Error) => {
            toast.error(error.message || 'Failed to update job');
          }
        }
      );
    } else {
      createJob.mutate(jobData, {
        onSuccess: () => {
          toast.success('Job created successfully');
          navigate('/jobs');
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to create job');
        }
      });
    }
  };

  const handleTestRun = () => {
    if (!url.trim()) {
      toast.error('Enter a URL before testing');
      return;
    }
    if (headers) {
      try {
        JSON.parse(headers);
      } catch {
        toast.error('Fix headers JSON before testing');
        return;
      }
    }
    testRun.mutate(
      {
        method,
        url: url.trim(),
        headers: headers ? JSON.parse(headers) : {},
        body: body.trim() || undefined,
        expectedStatus: parseInt(expectedStatus) || 200
      },
      {
        onSuccess: (response) => {
          const result = response.data;
          if (result.status === 'SUCCESS') {
            toast.success(`OK ${result.httpStatus} - ${result.durationMs}ms`);
          } else {
            toast.error(`${result.status}: ${result.error || result.httpStatus}`);
          }
        },
        onError: () => {
          toast.error('Failed to execute test run');
        }
      }
    );
  };

  if (isEditing && isLoadingJob) {
    return <LoadingSpinner />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isEditing ? 'Edit Job' : 'Create New Job'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="My Health Check"
          />

          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {enabled ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
          />

          <Input
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={errors.url}
            placeholder="https://api.example.com/health"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as JobFrequency)}
            options={FREQUENCY_OPTIONS}
          />

          <Input
            label="Expected Status"
            type="number"
            value={expectedStatus}
            onChange={(e) => setExpectedStatus(e.target.value)}
            error={errors.expectedStatus}
            min={100}
            max={599}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Headers (JSON)
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.headers ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder='{"Authorization": "Bearer xxx"}'
          />
          {errors.headers && <p className="mt-1 text-sm text-red-600">{errors.headers}</p>}
        </div>

        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <Textarea
            label="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
          />
        )}
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="success"
          onClick={handleTestRun}
          isLoading={testRun.isPending}
        >
          Test Run
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/jobs')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createJob.isPending || updateJob.isPending}
          >
            {isEditing ? 'Update Job' : 'Create Job'}
          </Button>
        </div>
      </div>
    </form>
  );
}
