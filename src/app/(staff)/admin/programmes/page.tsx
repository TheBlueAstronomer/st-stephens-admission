import { prisma } from '@/lib/db';
import { ProgrammeManagementTable } from '@/features/admin/components/programme-management-table';

export const dynamic = 'force-dynamic';

export default async function AdminProgrammesPage() {
  const programmes = await prisma.academicProgramme.findMany({
    orderBy: { courseTitle: 'asc' },
    include: { _count: { select: { applicants: true } } },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1A2744]">Academic Programmes</h2>
      <ProgrammeManagementTable programmes={programmes} />
    </div>
  );
}
