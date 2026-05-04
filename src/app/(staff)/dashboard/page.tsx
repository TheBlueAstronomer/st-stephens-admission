import { Suspense } from 'react';
import {
  getDashboardKpis,
  getPipelineByStatus,
  getAccommodationSummary,
  getDioceseDistribution,
  getBapSummary,
} from '@/lib/queries/dashboard';
import { getReferenceData } from '@/lib/queries/applicants';
import { KpiStatCard } from '@/components/dashboard/kpi-stat-card';
import { PipelineChart } from '@/components/dashboard/pipeline-chart';
import { AccommodationChart } from '@/components/dashboard/accommodation-chart';
import { DioceseChart } from '@/components/dashboard/diocese-chart';
import { BapChart } from '@/components/dashboard/bap-chart';
import { DashboardFilterBar } from '@/components/dashboard/dashboard-filter-bar';
import { DashboardExportButton } from '@/components/dashboard/dashboard-export-button';
import {
  UsersIcon,
  CalendarCheckIcon,
  SealCheckIcon,
  FileTextIcon,
  CrossIcon,
  HouseIcon,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const filters = {
    admissionsYearId: typeof params.admissionsYearId === 'string' ? params.admissionsYearId : undefined,
    programmeId: typeof params.programmeId === 'string' ? params.programmeId : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    dioceseId: typeof params.dioceseId === 'string' ? params.dioceseId : undefined,
  };

  const [kpis, pipeline, accommodation, dioceseDistribution, bapSummary, referenceData] =
    await Promise.all([
      getDashboardKpis(filters),
      getPipelineByStatus(filters),
      getAccommodationSummary(filters),
      getDioceseDistribution(filters),
      getBapSummary(filters),
      getReferenceData(),
    ]);

  const currentYear = referenceData.admissionsYears.find((y) => y.isCurrent);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {currentYear?.label ?? 'All Years'}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A2744]">
            Admissions Dashboard
          </h1>
        </div>
        <DashboardExportButton filters={filters} />
      </div>

      {/* Filter bar */}
      <DashboardFilterBar filters={filters} referenceData={referenceData} />

      {/* KPI stat cards — 6-col bento */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiStatCard
          label="Enquiries"
          value={kpis.totalEnquiries}
          subtitle="total applicants"
          icon={<UsersIcon size={20} weight="light" />}
          delay={0}
        />
        <KpiStatCard
          label="Interviews"
          value={kpis.totalInterviews}
          subtitle="scheduled + completed"
          icon={<CalendarCheckIcon size={20} weight="light" />}
          delay={80}
        />
        <KpiStatCard
          label="Offers"
          value={kpis.totalOffers}
          subtitle="conditional + unconditional"
          icon={<SealCheckIcon size={20} weight="light" />}
          delay={160}
        />
        <KpiStatCard
          label="Registrations"
          value={kpis.totalRegistrations}
          subtitle="forms received"
          icon={<FileTextIcon size={20} weight="light" />}
          delay={240}
        />
        <KpiStatCard
          label="Ordinands"
          value={kpis.confirmedOrdinands}
          subtitle="confirmed"
          icon={<CrossIcon size={20} weight="light" />}
          delay={320}
        />
        <KpiStatCard
          label="Accommodation"
          value={kpis.accommodationDemand}
          subtitle={`${accommodation.singleRooms} single, ${accommodation.familyUnits} family`}
          icon={<HouseIcon size={20} weight="light" />}
          delay={400}
        />
      </div>

      {/* Charts row 1: Pipeline (8-col) + Accommodation donut (4-col) */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-xl bg-white p-5 ring-1 ring-black/6 lg:col-span-8">
          <h2 className="mb-4 text-sm font-medium text-[#1A2744]">
            Pipeline by Status
          </h2>
          <PipelineChart data={pipeline} />
        </div>
        <div className="rounded-xl bg-white p-5 ring-1 ring-black/6 lg:col-span-4">
          <h2 className="mb-4 text-sm font-medium text-[#1A2744]">
            Accommodation Breakdown
          </h2>
          <AccommodationChart data={accommodation} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-[#1A2744]">{accommodation.termTime}</span> Term-time
            </div>
            <div>
              <span className="font-medium text-[#1A2744]">{accommodation.fullYear}</span> Full-year
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2: Diocese (6-col) + BAP (6-col) */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-xl bg-white p-5 ring-1 ring-black/6 lg:col-span-6">
          <h2 className="mb-4 text-sm font-medium text-[#1A2744]">
            Diocese Distribution
          </h2>
          <DioceseChart data={dioceseDistribution} />
        </div>
        <div className="rounded-xl bg-white p-5 ring-1 ring-black/6 lg:col-span-6">
          <h2 className="mb-4 text-sm font-medium text-[#1A2744]">
            BAP Status Summary
          </h2>
          <BapChart stageOne={bapSummary.stageOne} stageTwo={bapSummary.stageTwo} />
        </div>
      </div>
    </div>
  );
}
