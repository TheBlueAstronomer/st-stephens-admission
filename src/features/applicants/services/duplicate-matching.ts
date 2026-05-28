import { prisma } from '@/lib/db';
import type { Applicant } from '@/generated/prisma/client';

export type MatchConfidence = 'HIGH' | 'LOW' | 'NONE';

export interface MatchResult {
  match: Applicant | null;
  confidence: MatchConfidence;
}

export async function findMatchingApplicant(params: {
  email?: string;
  applicantId?: string;
  legalName?: string;
  dateOfBirth?: string;
}): Promise<MatchResult> {
  const { email, applicantId, legalName, dateOfBirth } = params;

  // High confidence: exact match by applicant ID
  if (applicantId && applicantId.trim()) {
    const byId = await prisma.applicant.findFirst({
      where: { applicantId: applicantId.trim() },
    });
    if (byId) {
      return { match: byId, confidence: 'HIGH' };
    }
  }

  // High confidence: exact match by email (case-insensitive)
  if (email && email.trim()) {
    const byEmail = await prisma.applicant.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
    if (byEmail) {
      return { match: byEmail, confidence: 'HIGH' };
    }
  }

  // Low confidence: match by legal name + date of birth
  if (legalName && legalName.trim() && dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (!isNaN(dob.getTime())) {
      // Create date range for the entire day to handle timezone differences
      const startOfDay = new Date(dob);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dob);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const byNameDob = await prisma.applicant.findFirst({
        where: {
          legalName: { equals: legalName.trim(), mode: 'insensitive' },
          dateOfBirth: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (byNameDob) {
        return { match: byNameDob, confidence: 'LOW' };
      }
    }
  }

  return { match: null, confidence: 'NONE' };
}
