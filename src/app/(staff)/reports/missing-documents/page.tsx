import { getMissingDocsReport, type ReportFilterParams } from '@/lib/queries/reports';
import { getReferenceData } from '@/lib/queries/applicants';
import { ReportFilterBar } from '@/components/reports/report-filter-bar';
import { CsvExportButton } from '@/components/reports/csv-export-button';
import { reportFilename } from '@/lib/services/csv-export';
import { STATUS_LABELS } from '@/lib/constants/applicant-status';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import type { ApplicantStatus } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MissingDocumentsReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: ReportFilterParams = {
    admissionsYearId: typeof params.admissionsYearId === 'string' ? params.admissionsYearId : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
  };

  const [report, refData] = await Promise.all([
    getMissingDocsReport(filters),
    getReferenceData(),
  ]);

  const statusOptions = Object.entries(STATUS_LABELS).map(([id, label]) => ({ id, label }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2744]">Missing Documents</h2>
          <p className="text-xs text-muted-foreground">Applicants with outstanding required documents</p>
        </div>
        <CsvExportButton
          actionId="missingDocs"
          filters={filters}
          filename={reportFilename('missing-documents')}
        />
      </div>

      <ReportFilterBar
        filters={{ ...filters }}
        years={refData.admissionsYears.map((y) => ({ id: y.id, label: y.label }))}
        statuses={statusOptions}
      />

      {/* Summary alert */}
      {report.missingRows.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <WarningCircleIcon size={18} weight="fill" />
          <span className="font-medium">
            {report.missingRows.length} applicant{report.missingRows.length !== 1 ? 's have' : ' has'} outstanding required documents
          </span>
        </div>
      )}

      {/* Missing documents table */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TableHead>Applicant</TableHead>
              <TableHead>Missing Documents</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.missingRows.map((row) => (
              <TableRow key={row.applicantId}>
                <TableCell>
                  <div className="font-medium text-[#1A2744]">{row.legalName}</div>
                  <div className="text-xs text-muted-foreground">{row.applicantDisplayId}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.missingDocuments.map((doc) => (
                      <Badge key={doc} className="rounded-full border-0 bg-amber-100 text-amber-800 text-xs">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="rounded-full border-0 bg-muted text-muted-foreground text-xs">
                    {STATUS_LABELS[row.status as ApplicantStatus] ?? row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {report.missingRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  All applicants have complete documents
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Waived documents */}
      {report.waivedRows.length > 0 && (
        <>
          <Separator />
          <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
            <h3 className="mb-4 text-sm font-medium text-[#1A2744]">Waived Documents</h3>
            <Table>
              <TableHeader>
                <TableRow className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <TableHead>Applicant</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.waivedRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-[#1A2744]">{row.legalName}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full border-0 bg-muted text-muted-foreground text-xs">
                        {row.documentName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.waiverNote ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
