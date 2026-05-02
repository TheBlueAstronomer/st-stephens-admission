import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getInterviewById, getInterviewForAcademicStaff } from '@/lib/queries/interviews';
import { authorizeInterviewAccess } from '@/lib/business-rules/interview-access';
import { InterviewDetailView } from '@/components/interview-detail-view';

interface InterviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewDetailPage({
  params,
}: InterviewDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId || !userRole) {
    notFound();
  }

  // First, get the interview to check access
  const fullInterview = await getInterviewById(id);
  if (!fullInterview) {
    notFound();
  }

  // Check access
  const assignedUserIds = fullInterview.panelMembers.map((pm) => pm.userId);
  const accessResult = authorizeInterviewAccess({
    userId,
    userRole,
    assignedUserIds,
  });

  if (!accessResult.allowed) {
    notFound();
  }

  // Academic staff gets filtered view
  const isAcademicStaff = userRole === 'ACADEMIC_STAFF';
  const interview = isAcademicStaff
    ? await getInterviewForAcademicStaff(id)
    : fullInterview;

  if (!interview) {
    notFound();
  }

  const canRecordOutcome =
    userRole === 'ADMISSIONS_STAFF' ||
    userRole === 'SYSTEM_ADMINISTRATOR' ||
    (userRole === 'ACADEMIC_STAFF' && assignedUserIds.includes(userId));

  const canEdit = userRole === 'ADMISSIONS_STAFF' || userRole === 'SYSTEM_ADMINISTRATOR';

  return (
    <InterviewDetailView
      interview={interview}
      canRecordOutcome={canRecordOutcome}
      canEdit={canEdit}
      isAcademicStaff={isAcademicStaff}
    />
  );
}
