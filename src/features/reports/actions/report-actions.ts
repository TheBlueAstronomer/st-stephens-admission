'use server';

import { requireRole } from '@/lib/require-role';
import { actionSuccess, actionError, type ActionResult } from '@/lib/action-result';
import { generateCsv, type CsvColumn } from '@/features/reports/services/csv-export';
import {
  getPipelineReport,
  getDioceseReport,
  getBapReport,
  getOffersRegistrationsReport,
  getAccommodationReport,
  getMissingDocsReport,
  type ReportFilterParams,
  type PipelineReportRow,
  type DioceseReportRow,
  type BapDistributionRow,
  type AccommodationReportRow,
  type MissingDocsReportRow,
} from '@/features/reports/queries/reports';

const ALLOWED_ROLES = ['ADMISSIONS_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR'] as const;

// ─── Pipeline Report CSV ─────────────────────────────────────────────────────

export async function exportPipelineCSV(
  filters: ReportFilterParams,
): Promise<ActionResult<string>> {
  await requireRole(...ALLOWED_ROLES);
  try {
    const { rows } = await getPipelineReport(filters);
    const columns: CsvColumn<PipelineReportRow>[] = [
      { header: 'Status', accessor: (r) => r.label },
      { header: 'Count', accessor: (r) => r.count },
      { header: '% of Total', accessor: (r) => r.percentage },
    ];
    return actionSuccess(generateCsv(columns, rows));
  } catch {
    return actionError('Failed to export pipeline report.');
  }
}

// ─── Diocese Report CSV ──────────────────────────────────────────────────────

export async function exportDioceseCSV(
  filters: ReportFilterParams,
): Promise<ActionResult<string>> {
  await requireRole(...ALLOWED_ROLES);
  try {
    const { rows } = await getDioceseReport(filters);
    const columns: CsvColumn<DioceseReportRow>[] = [
      { header: 'Diocese', accessor: (r) => r.dioceseName },
      { header: 'Applicants', accessor: (r) => r.applicantCount },
      { header: 'Offers', accessor: (r) => r.offerCount },
      { header: 'Confirmed Ordinands', accessor: (r) => r.confirmedOrdinandCount },
    ];
    return actionSuccess(generateCsv(columns, rows));
  } catch {
    return actionError('Failed to export diocese report.');
  }
}

// ─── BAP Status Report CSV ──────────────────────────────────────────────────

export async function exportBapCSV(
  filters: ReportFilterParams,
): Promise<ActionResult<string>> {
  await requireRole(...ALLOWED_ROLES);
  try {
    const { distribution, blockedApplicants } = await getBapReport(filters);
    const distColumns: CsvColumn<BapDistributionRow>[] = [
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Stage 1 Count', accessor: (r) => r.stageOneCount },
      { header: 'Stage 2 Count', accessor: (r) => r.stageTwoCount },
    ];
    let csv = generateCsv(distColumns, distribution);
    if (blockedApplicants.length > 0) {
      csv += '\n\nBlocked Applicants\nName,Status,BAP Stage 1\n';
      csv += blockedApplicants
        .map((a) => `${a.legalName},${a.status},${a.bapStageOneStatus}`)
        .join('\n');
    }
    return actionSuccess(csv);
  } catch {
    return actionError('Failed to export BAP report.');
  }
}

// ─── Offers vs Registrations CSV ─────────────────────────────────────────────

export async function exportOffersRegistrationsCSV(
  filters: ReportFilterParams,
): Promise<ActionResult<string>> {
  await requireRole(...ALLOWED_ROLES);
  try {
    const data = await getOffersRegistrationsReport(filters);
    const csv = [
      'Metric,Count',
      `Conditional Offers,${data.conditionalOffers}`,
      `Unconditional Offers,${data.unconditionalOffers}`,
      `Accepted Offers,${data.acceptedOffers}`,
      `Registrations Received,${data.registrationsReceived}`,
      `Confirmed Ordinands,${data.confirmedOrdinands}`,
    ].join('\n');
    return actionSuccess(csv);
  } catch {
    return actionError('Failed to export offers/registrations report.');
  }
}

// ─── Accommodation Demand CSV ────────────────────────────────────────────────

export async function exportAccommodationCSV(
  filters: ReportFilterParams,
): Promise<ActionResult<string>> {
  await requireRole(...ALLOWED_ROLES);
  try {
    const report = await getAccommodationReport(filters);
    const columns: CsvColumn<AccommodationReportRow>[] = [
      { header: 'Applicant ID', accessor: (r) => r.applicantId },
      { header: 'Name', accessor: (r) => r.applicantName },
      { header: 'Type', accessor: (r) => r.type },
      { header: 'Duration', accessor: (r) => r.duration },
      { header: 'Family Size', accessor: (r) => r.familySize },
    ];
    let csv = `Total Demand,${report.totalDemand}\nSingle Rooms,${report.singleRooms}\nFamily Units,${report.familyUnits}\nAvg Family Size,${report.avgFamilySize}\nTerm-time,${report.termTime}\nFull-year,${report.fullYear}\n\n`;
    csv += generateCsv(columns, report.rows);
    return actionSuccess(csv);
  } catch {
    return actionError('Failed to export accommodation report.');
  }
}

// ─── Missing Documents CSV ───────────────────────────────────────────────────

export async function exportMissingDocsCSV(
  filters: ReportFilterParams,
): Promise<ActionResult<string>> {
  await requireRole(...ALLOWED_ROLES);
  try {
    const { missingRows, waivedRows } = await getMissingDocsReport(filters);
    const missingColumns: CsvColumn<MissingDocsReportRow>[] = [
      { header: 'Applicant ID', accessor: (r) => r.applicantDisplayId },
      { header: 'Name', accessor: (r) => r.legalName },
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Missing Documents', accessor: (r) => r.missingDocuments.join('; ') },
    ];
    let csv = generateCsv(missingColumns, missingRows);
    if (waivedRows.length > 0) {
      csv += '\n\nWaived Documents\nName,Document,Waiver Note\n';
      csv += waivedRows
        .map((w) => `${w.legalName},${w.documentName},${w.waiverNote ?? ''}`)
        .join('\n');
    }
    return actionSuccess(csv);
  } catch {
    return actionError('Failed to export missing documents report.');
  }
}
