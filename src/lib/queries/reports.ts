import { prisma } from '@/lib/db';
import type { ApplicantStatus } from '@/generated/prisma/client';
import { STATUS_LABELS } from '@/lib/constants/applicant-status';

export interface ReportFilterParams {
  admissionsYearId?: string;
  programmeId?: string;
  status?: string;
  dioceseId?: string;
}

function buildReportWhere(filters: ReportFilterParams) {
  const where: Record<string, unknown> = {};
  if (filters.admissionsYearId) where.admissionsYearId = filters.admissionsYearId;
  if (filters.programmeId) where.programmeId = filters.programmeId;
  if (filters.status) where.status = filters.status;
  if (filters.dioceseId) where.dioceseId = filters.dioceseId;
  return where;
}

// ─── Pipeline Report (US-03) ─────────────────────────────────────────────────

export interface PipelineReportRow {
  status: ApplicantStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface PipelineByProgramme {
  programmeName: string;
  counts: Record<string, number>;
}

export async function getPipelineReport(filters: ReportFilterParams = {}) {
  const where = buildReportWhere(filters);

  const [byStatus, byProgramme, total] = await Promise.all([
    prisma.applicant.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    }),
    prisma.applicant.findMany({
      where,
      select: {
        status: true,
        programme: { select: { courseTitle: true } },
      },
    }),
    prisma.applicant.count({ where }),
  ]);

  const statusMap = new Map(byStatus.map((r) => [r.status, r._count.id]));

  const rows: PipelineReportRow[] = Object.entries(STATUS_LABELS).map(([s, label]) => {
    const count = statusMap.get(s as ApplicantStatus) ?? 0;
    return {
      status: s as ApplicantStatus,
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  // Group by programme
  const progMap = new Map<string, Record<string, number>>();
  for (const a of byProgramme) {
    const prog = a.programme?.courseTitle ?? 'Unassigned';
    if (!progMap.has(prog)) progMap.set(prog, {});
    const counts = progMap.get(prog)!;
    counts[a.status] = (counts[a.status] ?? 0) + 1;
  }

  const programmeBreakdown: PipelineByProgramme[] = Array.from(progMap.entries()).map(
    ([programmeName, counts]) => ({ programmeName, counts }),
  );

  return { rows, programmeBreakdown, total };
}

// ─── Diocese Distribution Report (US-04) ─────────────────────────────────────

export interface DioceseReportRow {
  dioceseName: string;
  applicantCount: number;
  offerCount: number;
  confirmedOrdinandCount: number;
}

export async function getDioceseReport(filters: ReportFilterParams = {}) {
  const where = buildReportWhere(filters);

  const applicants = await prisma.applicant.findMany({
    where,
    select: {
      status: true,
      diocese: { select: { name: true } },
      offer: { select: { offerType: true } },
    },
  });

  const dioceseMap = new Map<
    string,
    { applicantCount: number; offerCount: number; confirmedOrdinandCount: number }
  >();

  for (const a of applicants) {
    const name = a.diocese?.name ?? 'Unknown';
    if (!dioceseMap.has(name)) {
      dioceseMap.set(name, { applicantCount: 0, offerCount: 0, confirmedOrdinandCount: 0 });
    }
    const row = dioceseMap.get(name)!;
    row.applicantCount++;
    if (a.offer) row.offerCount++;
    if (a.status === 'CONFIRMED_ORDINAND') row.confirmedOrdinandCount++;
  }

  const rows: DioceseReportRow[] = Array.from(dioceseMap.entries())
    .map(([dioceseName, data]) => ({ dioceseName, ...data }))
    .sort((a, b) => b.applicantCount - a.applicantCount);

  return { rows };
}

// ─── BAP Status Report (US-05) ───────────────────────────────────────────────

export interface BapDistributionRow {
  status: string;
  stageOneCount: number;
  stageTwoCount: number;
}

export interface BlockedApplicant {
  id: string;
  legalName: string;
  status: string;
  bapStageOneStatus: string;
}

export async function getBapReport(filters: ReportFilterParams = {}) {
  const where = buildReportWhere(filters);

  const bapRecords = await prisma.bAPStatus.findMany({
    where: { applicant: where },
    include: {
      applicant: {
        select: { id: true, legalName: true, status: true },
      },
    },
  });

  const statuses = ['COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE'];
  const s1Map = new Map<string, number>();
  const s2Map = new Map<string, number>();

  for (const r of bapRecords) {
    s1Map.set(r.stageOneStatus, (s1Map.get(r.stageOneStatus) ?? 0) + 1);
    s2Map.set(r.stageTwoStatus, (s2Map.get(r.stageTwoStatus) ?? 0) + 1);
  }

  const distribution: BapDistributionRow[] = statuses.map((s) => ({
    status: s,
    stageOneCount: s1Map.get(s) ?? 0,
    stageTwoCount: s2Map.get(s) ?? 0,
  }));

  const blockedApplicants: BlockedApplicant[] = bapRecords
    .filter(
      (r) =>
        r.stageOneStatus === 'INCOMPLETE' &&
        !r.hasStageOneBAPException,
    )
    .map((r) => ({
      id: r.applicant.id,
      legalName: r.applicant.legalName,
      status: r.applicant.status,
      bapStageOneStatus: r.stageOneStatus,
    }));

  return { distribution, blockedApplicants };
}

// ─── Offers vs Registrations Report (US-06) ──────────────────────────────────

export interface OffersRegistrationsReport {
  conditionalOffers: number;
  unconditionalOffers: number;
  acceptedOffers: number;
  registrationsReceived: number;
  confirmedOrdinands: number;
}

export async function getOffersRegistrationsReport(
  filters: ReportFilterParams = {},
): Promise<OffersRegistrationsReport> {
  const where = buildReportWhere(filters);

  const [conditional, unconditional, accepted, registrations, confirmed] = await Promise.all([
    prisma.applicant.count({ where: { ...where, status: 'CONDITIONAL_OFFER' } }),
    prisma.applicant.count({ where: { ...where, status: 'UNCONDITIONAL_OFFER' } }),
    prisma.offer.count({
      where: {
        acceptedAt: { not: null },
        applicant: where,
      },
    }),
    prisma.applicant.count({
      where: {
        ...where,
        status: { in: ['REGISTRATION_FORM_RECEIVED', 'DOCUMENTS_COMPLETE', 'CONFIRMED_ORDINAND'] as ApplicantStatus[] },
      },
    }),
    prisma.applicant.count({ where: { ...where, status: 'CONFIRMED_ORDINAND' } }),
  ]);

  return {
    conditionalOffers: conditional,
    unconditionalOffers: unconditional,
    acceptedOffers: accepted,
    registrationsReceived: registrations,
    confirmedOrdinands: confirmed,
  };
}

// ─── Accommodation Demand Report (US-07) ─────────────────────────────────────

export interface AccommodationReportRow {
  applicantId: string;
  applicantName: string;
  type: string;
  duration: string;
  familySize: number | null;
}

export interface AccommodationReport {
  totalDemand: number;
  singleRooms: number;
  familyUnits: number;
  avgFamilySize: number;
  termTime: number;
  fullYear: number;
  rows: AccommodationReportRow[];
}

export async function getAccommodationReport(
  filters: ReportFilterParams = {},
): Promise<AccommodationReport> {
  const where = buildReportWhere(filters);

  const requests = await prisma.accommodationRequest.findMany({
    where: {
      isAccommodationRequired: true,
      applicant: where,
    },
    include: {
      applicant: { select: { applicantId: true, legalName: true } },
    },
  });

  let singleRooms = 0;
  let familyUnits = 0;
  let termTime = 0;
  let fullYear = 0;
  let familySizeSum = 0;
  let familyCount = 0;

  const rows: AccommodationReportRow[] = [];

  for (const r of requests) {
    if (r.accommodationType === 'SINGLE') singleRooms++;
    if (r.accommodationType === 'FAMILY') {
      familyUnits++;
      if (r.familyUnitSize) {
        familySizeSum += r.familyUnitSize;
        familyCount++;
      }
    }
    if (r.duration === 'TERM_TIME') termTime++;
    if (r.duration === 'FULL_YEAR') fullYear++;

    rows.push({
      applicantId: r.applicant.applicantId,
      applicantName: r.applicant.legalName,
      type: r.accommodationType ?? 'Unknown',
      duration: r.duration ?? 'Unknown',
      familySize: r.familyUnitSize,
    });
  }

  return {
    totalDemand: singleRooms + familyUnits,
    singleRooms,
    familyUnits,
    avgFamilySize: familyCount > 0 ? Math.round((familySizeSum / familyCount) * 10) / 10 : 0,
    termTime,
    fullYear,
    rows,
  };
}

// ─── Missing Documents Report (US-08) ────────────────────────────────────────

export interface MissingDocsReportRow {
  applicantId: string;
  applicantDisplayId: string;
  legalName: string;
  status: string;
  missingDocuments: string[];
}

export interface WaivedDocRow {
  applicantId: string;
  legalName: string;
  documentName: string;
  waiverNote: string | null;
}

export async function getMissingDocsReport(filters: ReportFilterParams = {}) {
  const where = buildReportWhere(filters);

  const applicants = await prisma.applicant.findMany({
    where,
    include: {
      documents: {
        include: { documentType: true },
      },
    },
  });

  const allRequiredTypes = await prisma.documentType.findMany({
    where: { isActive: true, isRequired: true },
  });

  const missingRows: MissingDocsReportRow[] = [];
  const waivedRows: WaivedDocRow[] = [];

  for (const applicant of applicants) {
    const receivedOrWaivedIds = new Set(
      applicant.documents
        .filter((d) => d.isReceived || d.isWaived)
        .map((d) => d.documentTypeId)
        .filter(Boolean),
    );

    const missing = allRequiredTypes
      .filter((dt) => !receivedOrWaivedIds.has(dt.id))
      .map((dt) => dt.name);

    if (missing.length > 0) {
      missingRows.push({
        applicantId: applicant.id,
        applicantDisplayId: applicant.applicantId,
        legalName: applicant.legalName,
        status: applicant.status,
        missingDocuments: missing,
      });
    }

    for (const doc of applicant.documents) {
      if (doc.isWaived && doc.documentType) {
        waivedRows.push({
          applicantId: applicant.id,
          legalName: applicant.legalName,
          documentName: doc.documentType.name,
          waiverNote: doc.waiverNote,
        });
      }
    }
  }

  return { missingRows, waivedRows };
}
