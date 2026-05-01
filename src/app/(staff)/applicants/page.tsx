import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { getApplicantList } from '@/lib/queries/applicants';
import { getReferenceData } from '@/lib/queries/applicants';
import { ApplicantTable } from '@/components/applicant-table';
import { ApplicantListHeader } from '@/components/applicant-list-header';
import { ApplicantFilterBar } from '@/components/applicant-filter-bar';
import { Skeleton } from '@/components/ui/skeleton';

interface ApplicantsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ApplicantsPage({ searchParams }: ApplicantsPageProps) {
  const params = await searchParams;
  const session = await auth();
  const role = session?.user?.role;

  const page = parseInt(params.page ?? '1', 10);
  const filters = {
    search: params.search,
    status: params.status,
    admissionsYearId: params.admissionsYearId,
    programmeId: params.programmeId,
    dioceseId: params.dioceseId,
    page,
  };

  const [{ applicants, total, totalPages }, referenceData] = await Promise.all([
    getApplicantList(filters),
    getReferenceData(),
  ]);

  const canMutate = role === 'ADMISSIONS_STAFF' || role === 'SYSTEM_ADMINISTRATOR';

  return (
    <div className="space-y-6">
      <ApplicantListHeader
        canMutate={canMutate}
        currentYear={referenceData.admissionsYears.find((y) => y.isCurrent)?.label}
        referenceData={referenceData}
      />

      <ApplicantFilterBar
        filters={params}
        referenceData={referenceData}
        canExport={canMutate}
      />

      <Suspense fallback={<TableSkeleton />}>
        <ApplicantTable
          applicants={applicants}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
