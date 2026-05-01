import { prisma } from '@/lib/db';

/**
 * Get a single interview by ID with all related data.
 */
export async function getInterviewById(id: string) {
  return prisma.interview.findUnique({
    where: { id },
    include: {
      applicant: {
        include: {
          programme: { select: { courseTitle: true } },
          diocese: { select: { name: true } },
          bapStatus: { select: { stageOneStatus: true } },
          ecclesialProfile: {
            select: { directorOfOrdinandsName: true },
          },
        },
      },
      panelMembers: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
      invitationSentBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get interview detail with field filtering for academic staff.
 * Sensitive fields (DOB, address, legal ID, DBS) are excluded.
 */
export async function getInterviewForAcademicStaff(id: string) {
  return prisma.interview.findUnique({
    where: { id },
    include: {
      applicant: {
        select: {
          id: true,
          applicantId: true,
          legalName: true,
          preferredName: true,
          status: true,
          programme: { select: { courseTitle: true } },
          diocese: { select: { name: true } },
          bapStatus: { select: { stageOneStatus: true } },
          ecclesialProfile: {
            select: { directorOfOrdinandsName: true },
          },
          // Excluded: dateOfBirth, email, phone, address*, country, postcode
        },
      },
      panelMembers: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
      invitationSentBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get all academic staff users for interviewer selection.
 */
export async function getAcademicStaffUsers() {
  return prisma.user.findMany({
    where: { role: 'ACADEMIC_STAFF', isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get interviews for a specific user (panel member).
 */
export async function getInterviewsForUser(userId: string) {
  return prisma.interview.findMany({
    where: {
      panelMembers: { some: { userId } },
    },
    include: {
      applicant: {
        select: {
          id: true,
          applicantId: true,
          legalName: true,
          status: true,
          programme: { select: { courseTitle: true } },
        },
      },
      panelMembers: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  });
}

/**
 * Get all interviews (for admissions staff).
 */
export async function getAllInterviews() {
  return prisma.interview.findMany({
    include: {
      applicant: {
        select: {
          id: true,
          applicantId: true,
          legalName: true,
          status: true,
          programme: { select: { courseTitle: true } },
        },
      },
      panelMembers: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  });
}
