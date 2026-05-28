import { prisma } from '@/lib/db';

/**
 * Generate a unique applicant ID in the format SSH-{year}-{sequential}.
 * e.g. SSH-2025-0001, SSH-2025-0002, etc.
 */
export async function generateApplicantId(admissionsYear?: string): Promise<string> {
  const year = admissionsYear || new Date().getFullYear().toString();
  const prefix = `SSH-${year}-`;

  // Find the highest existing sequential number for this year
  const lastApplicant = await prisma.applicant.findFirst({
    where: { applicantId: { startsWith: prefix } },
    orderBy: { applicantId: 'desc' },
    select: { applicantId: true },
  });

  let nextSeq = 1;
  if (lastApplicant) {
    const lastSeq = parseInt(lastApplicant.applicantId.replace(prefix, ''), 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}
