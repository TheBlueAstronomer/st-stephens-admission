import { getAccommodationReport, type ReportFilterParams } from '@/features/reports/queries/reports';
import { getReferenceData } from '@/features/applicants/queries/applicants';
import { ReportFilterBar } from '@/features/reports/components/report-filter-bar';
import { CsvExportButton } from '@/features/reports/components/csv-export-button';
import { reportFilename } from '@/features/reports/services/csv-export';
import { KpiStatCard } from '@/features/dashboard/components/kpi-stat-card';
import { AccommodationReportCharts } from '@/features/reports/components/accommodation-report-charts';
import { HouseIcon, UserIcon, UsersIcon } from '@phosphor-icons/react/dist/ssr';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccommodationReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: ReportFilterParams = {
    admissionsYearId: typeof params.admissionsYearId === 'string' ? params.admissionsYearId : undefined,
  };

  const [report, refData] = await Promise.all([
    getAccommodationReport(filters),
    getReferenceData(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2744]">Accommodation Demand</h2>
          <p className="text-xs text-muted-foreground">Housing requirements for confirmed and registered applicants</p>
        </div>
        <CsvExportButton
          actionId="accommodation"
          filters={filters}
          filename={reportFilename('accommodation-demand')}
        />
      </div>

      <ReportFilterBar
        filters={{ ...filters }}
        years={refData.admissionsYears.map((y) => ({ id: y.id, label: y.label }))}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiStatCard label="Total Demand" value={report.totalDemand} icon={<HouseIcon size={18} weight="light" />} delay={0} />
        <KpiStatCard label="Single Rooms" value={report.singleRooms} icon={<UserIcon size={18} weight="light" />} delay={80} />
        <KpiStatCard label="Family Units" value={report.familyUnits} subtitle={`avg size ${report.avgFamilySize}`} icon={<UsersIcon size={18} weight="light" />} delay={160} />
      </div>

      {/* Charts */}
      <AccommodationReportCharts report={report} />

      {/* Per-applicant table */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TableHead>Applicant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Family Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => (
              <TableRow key={row.applicantId}>
                <TableCell className="font-medium text-[#1A2744]">{row.applicantName}</TableCell>
                <TableCell className="text-muted-foreground">{row.type}</TableCell>
                <TableCell className="text-muted-foreground">{row.duration.replace('_', ' ')}</TableCell>
                <TableCell className="text-right tabular-nums">{row.familySize ?? '-'}</TableCell>
              </TableRow>
            ))}
            {report.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No accommodation requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
