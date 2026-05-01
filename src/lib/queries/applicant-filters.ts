export interface ApplicantFilterParams {
  search?: string;
  status?: string;
  admissionsYearId?: string;
  programmeId?: string;
  dioceseId?: string;
  [key: string]: string | number | undefined;
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
