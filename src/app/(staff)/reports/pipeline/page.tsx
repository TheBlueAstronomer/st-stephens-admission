import { getPipelineReport, type ReportFilterParams } from '@/lib/queries/reports';
import { getReferenceData } from '@/lib/queries/applicants';
import { ReportFilterBar } from '@/components/reports/report-filter-bar';
import { CsvExportButton } from '@/components/reports/csv-export-button';
import { PipelineReportChart } from '@/components/reports/pipeline-report-chart';
import { PipelineReportTable } from '@/components/reports/pipeline-report-table';
import { reportFilename } from '@/lib/services/csv-export';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PipelineReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: ReportFilterParams = {
    admissionsYearId: typeof params.admissionsYearId === 'string' ? params.admissionsYearId : undefined,
    programmeId: typeof params.programmeId === 'string' ? params.programmeId : undefined,
  };

  const [report, refData] = await Promise.all([
    getPipelineReport(filters),
    getReferenceData(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2744]">Admissions Pipeline</h2>
          <p className="text-xs text-muted-foreground">Applicant counts by status and programme</p>
        </div>
        <CsvExportButton
          actionId="pipeline"
          filters={filters}
          filename={reportFilename('pipeline-report')}
        />
      </div>

      <ReportFilterBar
        filters={{ ...filters }}
        years={refData.admissionsYears.map((y) => ({ id: y.id, label: y.label }))}
        programmes={refData.programmes.map((p) => ({ id: p.id, label: p.courseTitle }))}
      />

      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <PipelineReportChart rows={report.rows} />
      </div>

      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <h3 className="mb-4 text-sm font-medium text-[#1A2744]">Breakdown by Programme</h3>
        <PipelineReportTable rows={report.rows} programmeBreakdown={report.programmeBreakdown} total={report.total} />
      </div>
    </div>
  );
}
