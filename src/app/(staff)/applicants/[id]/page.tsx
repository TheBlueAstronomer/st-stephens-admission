import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getApplicantById } from '@/lib/queries/applicants';
import { ApplicantDetailView } from '@/components/applicant-detail-view';

interface ApplicantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantDetailPage({
  params,
}: ApplicantDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;

  const applicant = await getApplicantById(id);

  if (!applicant) {
    notFound();
  }

  const canEdit = role === 'ADMISSIONS_STAFF' || role === 'SYSTEM_ADMINISTRATOR';

  return <ApplicantDetailView applicant={applicant} canEdit={canEdit} />;
}
