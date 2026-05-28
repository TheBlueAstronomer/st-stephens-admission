import { auth } from '@/lib/auth';
import { getAllInterviews, getInterviewsForUser } from '@/features/interviews/queries/interviews';
import { InterviewListView } from '@/features/interviews/components/interview-list-view';

export default async function InterviewsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId || !userRole) {
    return null;
  }

  // Academic staff sees only assigned interviews; admissions/admin see all
  const interviews =
    userRole === 'ACADEMIC_STAFF'
      ? await getInterviewsForUser(userId)
      : await getAllInterviews();

  return <InterviewListView interviews={interviews} userRole={userRole} />;
}
