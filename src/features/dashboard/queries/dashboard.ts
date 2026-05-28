import { prisma } from '@/lib/db';
import type { ApplicantStatus } from '@/generated/prisma/client';
import { STATUS_LABELS } from '@/features/admissions-lifecycle/constants/applicant-status';

export interface DashboardFilterParams {
  admissionsYearId?: string;
  programmeId?: string;
  status?: string;
  dioceseId?: string;
}

function buildDashboardWhere(filters: DashboardFilterParams) {
  const where: Record<string, unknown> = {};
  if (filters.admissionsYearId) where.admissionsYearId = filters.admissionsYearId;
  if (filters.programmeId) where.programmeId = filters.programmeId;
  if (filters.status) where.status = filters.status;
  if (filters.dioceseId) where.dioceseId = filters.dioceseId;
  return where;
}

export interface KpiMetrics {
  totalEnquiries: number;
  totalInterviews: number;
  totalOffers: number;
  totalRegistrations: number;
  confirmedOrdinands: number;
  accommodationDemand: number;
}

export async function getDashboardKpis(
  filters: DashboardFilterParams = {},
): Promise<KpiMetrics> {
  const where = buildDashboardWhere(filters);

  const [
    totalEnquiries,
    totalInterviews,
    totalOffers,
    totalRegistrations,
    confirmedOrdinands,
    accommodationRequests,
  ] = await Promise.all([
    prisma.applicant.count({ where }),
    prisma.applicant.count({
      where: {
        ...where,
        status: { in: ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'] as ApplicantStatus[] },
      },
    }),
    prisma.applicant.count({
      where: {
        ...where,
        status: { in: ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER'] as ApplicantStatus[] },
      },
    }),
    prisma.applicant.count({
      where: {
        ...where,
        status: { in: ['REGISTRATION_FORM_RECEIVED', 'DOCUMENTS_COMPLETE', 'CONFIRMED_ORDINAND'] as ApplicantStatus[] },
      },
    }),
    prisma.applicant.count({
      where: { ...where, status: 'CONFIRMED_ORDINAND' },
    }),
    prisma.accommodationRequest.findMany({
      where: {
        isAccommodationRequired: true,
        applicant: where,
      },
      select: {
        accommodationType: true,
      },
    }),
  ]);

  return {
    totalEnquiries,
    totalInterviews,
    totalOffers,
    totalRegistrations,
    confirmedOrdinands,
    accommodationDemand: accommodationRequests.length,
  };
}

export interface PipelineStage {
  status: ApplicantStatus;
  label: string;
  count: number;
}

export async function getPipelineByStatus(
  filters: DashboardFilterParams = {},
): Promise<PipelineStage[]> {
  const where = buildDashboardWhere(filters);

  const counts = await prisma.applicant.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
  });

  const countMap = new Map(counts.map((c) => [c.status, c._count.id]));

  return Object.entries(STATUS_LABELS).map(([status, label]) => ({
    status: status as ApplicantStatus,
    label,
    count: countMap.get(status as ApplicantStatus) ?? 0,
  }));
}

export interface AccommodationSummary {
  totalDemand: number;
  singleRooms: number;
  familyUnits: number;
  termTime: number;
  fullYear: number;
}

export async function getAccommodationSummary(
  filters: DashboardFilterParams = {},
): Promise<AccommodationSummary> {
  const where = buildDashboardWhere(filters);

  const requests = await prisma.accommodationRequest.findMany({
    where: {
      isAccommodationRequired: true,
      applicant: where,
    },
    select: {
      accommodationType: true,
      duration: true,
    },
  });

  let singleRooms = 0;
  let familyUnits = 0;
  let termTime = 0;
  let fullYear = 0;

  for (const r of requests) {
    if (r.accommodationType === 'SINGLE') singleRooms++;
    if (r.accommodationType === 'FAMILY') familyUnits++;
    if (r.duration === 'TERM_TIME') termTime++;
    if (r.duration === 'FULL_YEAR') fullYear++;
  }

  return {
    totalDemand: singleRooms + familyUnits,
    singleRooms,
    familyUnits,
    termTime,
    fullYear,
  };
}

export interface DioceseDistribution {
  dioceseName: string;
  applicantCount: number;
}

export async function getDioceseDistribution(
  filters: DashboardFilterParams = {},
): Promise<DioceseDistribution[]> {
  const where = buildDashboardWhere(filters);

  const applicants = await prisma.applicant.findMany({
    where,
    select: {
      diocese: { select: { name: true } },
    },
  });

  const dioceseMap = new Map<string, number>();
  for (const a of applicants) {
    const name = a.diocese?.name ?? 'Unknown';
    dioceseMap.set(name, (dioceseMap.get(name) ?? 0) + 1);
  }

  return Array.from(dioceseMap.entries())
    .map(([dioceseName, applicantCount]) => ({ dioceseName, applicantCount }))
    .sort((a, b) => b.applicantCount - a.applicantCount);
}

export interface BapSummaryStage {
  status: string;
  count: number;
}

export async function getBapSummary(
  filters: DashboardFilterParams = {},
): Promise<{ stageOne: BapSummaryStage[]; stageTwo: BapSummaryStage[] }> {
  const where = buildDashboardWhere(filters);

  const bapRecords = await prisma.bAPStatus.findMany({
    where: { applicant: where },
    select: { stageOneStatus: true, stageTwoStatus: true },
  });

  const s1Map = new Map<string, number>();
  const s2Map = new Map<string, number>();

  for (const r of bapRecords) {
    s1Map.set(r.stageOneStatus, (s1Map.get(r.stageOneStatus) ?? 0) + 1);
    s2Map.set(r.stageTwoStatus, (s2Map.get(r.stageTwoStatus) ?? 0) + 1);
  }

  const toArray = (m: Map<string, number>) =>
    Array.from(m.entries()).map(([status, count]) => ({ status, count }));

  return { stageOne: toArray(s1Map), stageTwo: toArray(s2Map) };
}
