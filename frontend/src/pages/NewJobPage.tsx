import { Layout } from '../components/layout/Layout';
import { JobForm } from '../components/jobs/JobForm';

export function NewJobPage() {
  return (
    <Layout>
      <div className="mb-8">
        <JobForm />
      </div>
    </Layout>
  );
}
