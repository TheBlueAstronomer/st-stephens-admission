import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { buildWhereClause, type ApplicantFilterParams } from '@/lib/queries/applicant-filters';

const PAGE_SIZE = 20;

const applicantDetailInclude = {
  programme: true,
  diocese: true,
  admissionsYear: true,
  ecclesialProfile: { include: { diocese: true } },
  bapStatus: true,
  offer: true,
  registration: true,
  accommodationRequest: true,
  documents: { include: { documentType: true } },
  interviews: {
    include: {
      createdBy: true,
      updatedBy: true,
      invitationSentBy: { select: { id: true, name: true } },
      panelMembers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  auditLogs: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { performedAt: 'desc' },
  },
} satisfies Prisma.ApplicantInclude;

export type ApplicantDetail = Prisma.ApplicantGetPayload<{
  include: typeof applicantDetailInclude;
}>;

export interface ApplicantListFilters extends ApplicantFilterParams {
  page?: number;
}

export async function getApplicantList(filters: ApplicantListFilters) {
  const page = filters.page ?? 1;
  const skip = (page - 1) * PAGE_SIZE;

  const where = buildWhereClause(filters);

  const [applicants, total] = await Promise.all([
    prisma.applicant.findMany({
      where,
      include: {
        programme: { select: { id: true, courseTitle: true } },
        diocese: { select: { id: true, name: true } },
        admissionsYear: { select: { id: true, label: true } },
        bapStatus: { select: { stageOneStatus: true } },
        documents: { select: { isReceived: true, isRequired: true } },
        interviews: {
          select: { scheduledAt: true, status: true },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
        offer: { select: { offerType: true } },
        registration: { select: { receivedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.applicant.count({ where }),
  ]);

  return {
    applicants,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getApplicantById(id: string) {
  return prisma.applicant.findUnique({
    where: { id },
    include: applicantDetailInclude,
  });
}

export async function getReferenceData() {
  const [programmes, dioceses, admissionsYears] = await Promise.all([
    prisma.academicProgramme.findMany({
      where: { isActive: true },
      orderBy: { courseTitle: 'asc' },
    }),
    prisma.diocese.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.admissionsYear.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    }),
  ]);

  return { programmes, dioceses, admissionsYears };
}
