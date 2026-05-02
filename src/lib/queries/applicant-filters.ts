export interface ApplicantFilterParams {
  search?: string;
  status?: string;
  admissionsYearId?: string;
  programmeId?: string;
  dioceseId?: string;
  [key: string]: string | number | undefined;
}

/**
 * Statuses that are considered inactive / terminal and should be excluded
 * from active registration and pipeline workflows (US-10).
 */
export const INACTIVE_STATUSES = ['DECLINED', 'WITHDRAWN'] as const;

/**
 * Build a where clause that excludes DECLINED and WITHDRAWN applicants.
 * Use for registration lists, confirmation candidates, and active pipeline queries.
 */
export function buildActiveRegistrationWhereClause(filters: ApplicantFilterParams) {
  const base = buildWhereClause(filters);
  // Override status filter: exclude DECLINED / WITHDRAWN unless caller explicitly filtered
  if (!filters.status) {
    (base as Record<string, unknown>).status = { notIn: INACTIVE_STATUSES };
  }
  return base;
}

/**
 * Build Prisma where clause from applicant list filter params.
 */
export function buildWhereClause(filters: ApplicantFilterParams) {
  const where: Record<string, unknown> = {};

  if (filters.search) {
    where.OR = [
      { legalName: { contains: filters.search, mode: 'insensitive' } },
      { preferredName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { applicantId: { contains: filters.search, mode: 'insensitive' } },
      { diocese: { name: { contains: filters.search, mode: 'insensitive' } } },
      {
        ecclesialProfile: {
          directorOfOrdinandsName: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.admissionsYearId) {
    where.admissionsYearId = filters.admissionsYearId;
  }

  if (filters.programmeId) {
    where.programmeId = filters.programmeId;
  }

  if (filters.dioceseId) {
    where.dioceseId = filters.dioceseId;
  }

  return where;
}
