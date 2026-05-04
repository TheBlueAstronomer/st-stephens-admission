import { prisma } from '@/lib/db';
import { AdmissionsYearManagementTable } from '@/components/admin/admissions-year-management-table';

export const dynamic = 'force-dynamic';

export default async function AdminAdmissionsYearsPage() {
  const years = await prisma.admissionsYear.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { applicants: true } } },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1A2744]">Admissions Years</h2>
      <AdmissionsYearManagementTable years={years} />
    </div>
  );
}
