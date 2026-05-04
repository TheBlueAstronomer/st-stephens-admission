import { prisma } from '@/lib/db';
import { DioceseManagementTable } from '@/components/admin/diocese-management-table';

export const dynamic = 'force-dynamic';

export default async function AdminDiocesesPage() {
  const dioceses = await prisma.diocese.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { applicants: true } } },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1A2744]">Dioceses</h2>
      <DioceseManagementTable dioceses={dioceses} />
    </div>
  );
}
