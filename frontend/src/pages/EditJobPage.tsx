import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { JobForm } from '../components/jobs/JobForm';

export function EditJobPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <JobForm jobId={id} />
    </Layout>
  );
}
