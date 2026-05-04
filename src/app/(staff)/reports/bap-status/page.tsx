import { getBapReport, type ReportFilterParams } from '@/lib/queries/reports';
import { getReferenceData } from '@/lib/queries/applicants';
import { ReportFilterBar } from '@/components/reports/report-filter-bar';
import { CsvExportButton } from '@/components/reports/csv-export-button';
import { reportFilename } from '@/lib/services/csv-export';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BapStatusReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: ReportFilterParams = {
    admissionsYearId: typeof params.admissionsYearId === 'string' ? params.admissionsYearId : undefined,
  };

  const [report, refData] = await Promise.all([
    getBapReport(filters),
    getReferenceData(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2744]">BAP Status</h2>
          <p className="text-xs text-muted-foreground">Stage 1 and Stage 2 BAP status distribution</p>
        </div>
        <CsvExportButton
          actionId="bap"
          filters={filters}
          filename={reportFilename('bap-status')}
        />
      </div>

      <ReportFilterBar
        filters={{ ...filters }}
        years={refData.admissionsYears.map((y) => ({ id: y.id, label: y.label }))}
      />

      {/* Distribution Table */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Stage 1</TableHead>
              <TableHead className="text-right">Stage 2</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.distribution.map((row) => (
              <TableRow key={row.status}>
                <TableCell className="font-medium text-[#1A2744]">{row.status.replace('_', ' ')}</TableCell>
                <TableCell className="text-right tabular-nums">{row.stageOneCount}</TableCell>
                <TableCell className="text-right tabular-nums">{row.stageTwoCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Blocked Applicants */}
      {report.blockedApplicants.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <WarningCircleIcon size={18} weight="fill" />
            <span className="text-sm font-medium">
              {report.blockedApplicants.length} Blocked Applicant{report.blockedApplicants.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-amber-200 text-xs font-medium uppercase tracking-wider text-amber-700">
                <TableHead className="text-amber-700">Name</TableHead>
                <TableHead className="text-amber-700">Status</TableHead>
                <TableHead className="text-amber-700">BAP Stage 1</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.blockedApplicants.map((a) => (
                <TableRow key={a.id} className="border-amber-100">
                  <TableCell className="font-medium">{a.legalName}</TableCell>
                  <TableCell className="text-muted-foreground">{a.status}</TableCell>
                  <TableCell className="text-amber-700 font-medium">{a.bapStageOneStatus}</TableCell>
                  <TableCell>
                    <Link
                      href={`/applicants/${a.id}`}
                      className="text-xs text-brand-ink underline hover:no-underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
