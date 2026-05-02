import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getApplicantById } from '@/lib/queries/applicants';
import { getAcademicStaffUsers } from '@/lib/queries/interviews';
import { getAllDocumentTypes, getDocumentChecklist } from '@/lib/queries/documents';
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

  const userRole = session?.user?.role ?? 'ACADEMIC_STAFF';

  // Fetch available interviewers, document types, and checklist in parallel
  const [availableInterviewers, allDocumentTypes, documentChecklist] = await Promise.all([
    canEdit ? getAcademicStaffUsers() : Promise.resolve([]),
    getAllDocumentTypes(),
    getDocumentChecklist(applicant.id, userRole as Parameters<typeof getDocumentChecklist>[1]),
  ]);

  return (
    <ApplicantDetailView
      applicant={applicant}
      canEdit={canEdit}
      availableInterviewers={availableInterviewers}
      allDocumentTypes={allDocumentTypes}
      documentChecklist={documentChecklist}
    />
  );
}
