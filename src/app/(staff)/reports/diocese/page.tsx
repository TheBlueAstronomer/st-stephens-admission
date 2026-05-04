import { getDioceseReport, type ReportFilterParams } from '@/lib/queries/reports';
import { getReferenceData } from '@/lib/queries/applicants';
import { ReportFilterBar } from '@/components/reports/report-filter-bar';
import { CsvExportButton } from '@/components/reports/csv-export-button';
import { reportFilename } from '@/lib/services/csv-export';
import { DioceseReportChart } from '@/components/reports/diocese-report-chart';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DioceseReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: ReportFilterParams = {
    admissionsYearId: typeof params.admissionsYearId === 'string' ? params.admissionsYearId : undefined,
  };

  const [report, refData] = await Promise.all([
    getDioceseReport(filters),
    getReferenceData(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2744]">Diocese Distribution</h2>
          <p className="text-xs text-muted-foreground">Applicants, offers, and confirmed ordinands by diocese</p>
        </div>
        <CsvExportButton
          actionId="diocese"
          filters={filters}
          filename={reportFilename('diocese-distribution')}
        />
      </div>

      <ReportFilterBar
        filters={{ ...filters }}
        years={refData.admissionsYears.map((y) => ({ id: y.id, label: y.label }))}
      />

      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <DioceseReportChart rows={report.rows} />
      </div>

      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TableHead>Diocese</TableHead>
              <TableHead className="text-right">Applicants</TableHead>
              <TableHead className="text-right">Offers</TableHead>
              <TableHead className="text-right">Confirmed Ordinands</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => (
              <TableRow key={row.dioceseName}>
                <TableCell className="font-medium text-[#1A2744]">{row.dioceseName}</TableCell>
                <TableCell className="text-right tabular-nums">{row.applicantCount}</TableCell>
                <TableCell className="text-right tabular-nums">{row.offerCount}</TableCell>
                <TableCell className="text-right tabular-nums">{row.confirmedOrdinandCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
