import { getOffersRegistrationsReport, type ReportFilterParams } from '@/lib/queries/reports';
import { getReferenceData } from '@/lib/queries/applicants';
import { ReportFilterBar } from '@/components/reports/report-filter-bar';
import { CsvExportButton } from '@/components/reports/csv-export-button';
import { reportFilename } from '@/lib/services/csv-export';
import { KpiStatCard } from '@/components/dashboard/kpi-stat-card';
import { OffersRegistrationsFunnel } from '@/components/reports/offers-funnel-chart';
import {
  SealCheckIcon,
  FileTextIcon,
  CrossIcon,
  CheckCircleIcon,
  HandshakeIcon,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OffersRegistrationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: ReportFilterParams = {
    admissionsYearId: typeof params.admissionsYearId === 'string' ? params.admissionsYearId : undefined,
  };

  const [report, refData] = await Promise.all([
    getOffersRegistrationsReport(filters),
    getReferenceData(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2744]">Offers vs Registrations</h2>
          <p className="text-xs text-muted-foreground">Conversion through the offer-to-confirmation funnel</p>
        </div>
        <CsvExportButton
          actionId="offersRegistrations"
          filters={filters}
          filename={reportFilename('offers-registrations')}
        />
      </div>

      <ReportFilterBar
        filters={{ ...filters }}
        years={refData.admissionsYears.map((y) => ({ id: y.id, label: y.label }))}
      />

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiStatCard label="Conditional" value={report.conditionalOffers} icon={<SealCheckIcon size={18} weight="light" />} delay={0} />
        <KpiStatCard label="Unconditional" value={report.unconditionalOffers} icon={<CheckCircleIcon size={18} weight="light" />} delay={80} />
        <KpiStatCard label="Accepted" value={report.acceptedOffers} icon={<HandshakeIcon size={18} weight="light" />} delay={160} />
        <KpiStatCard label="Registrations" value={report.registrationsReceived} icon={<FileTextIcon size={18} weight="light" />} delay={240} />
        <KpiStatCard label="Confirmed" value={report.confirmedOrdinands} icon={<CrossIcon size={18} weight="light" />} delay={320} />
      </div>

      {/* Funnel chart */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <OffersRegistrationsFunnel report={report} />
      </div>
    </div>
  );
}
