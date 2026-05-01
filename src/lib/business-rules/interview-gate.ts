import type { InterviewStatus } from '@/generated/prisma/client';

export interface InterviewGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates whether an applicant can progress to offer decision.
 * Requires at least one completed interview, or the interview marked NOT_REQUIRED.
 */
export function validateInterviewGate(interviews: { status: InterviewStatus }[]): InterviewGateResult {
  if (interviews.length === 0) {
    // No interviews — treat as not required (gate passes)
    return { allowed: true };
  }

  const hasCompleted = interviews.some((i) => i.status === 'COMPLETED');
  const hasNotRequired = interviews.some((i) => i.status === 'NOT_REQUIRED');

  if (hasCompleted || hasNotRequired) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'At least one interview must be completed or marked as not required before proceeding to offer decision.',
  };
}
