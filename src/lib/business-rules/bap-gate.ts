import type { BAPStageStatus } from '@/generated/prisma/client';

export interface BAPGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates the BAP prerequisite gate.
 * Stage 1 BAP must be COMPLETED or SCHEDULED to progress past ENQUIRY,
 * unless an exception is explicitly recorded with a reason.
 */
export function validateBAPGate(params: {
  stageOneStatus: BAPStageStatus;
  hasException: boolean;
  exceptionReason?: string | null;
}): BAPGateResult {
  const { stageOneStatus, hasException, exceptionReason } = params;

  // If BAP is completed or scheduled, always allow
  if (stageOneStatus === 'COMPLETED' || stageOneStatus === 'SCHEDULED') {
    return { allowed: true };
  }

  // If exception is marked with a reason, allow
  if (hasException && exceptionReason && exceptionReason.trim().length > 0) {
    return { allowed: true };
  }

  // If exception is marked but no reason, block
  if (hasException && (!exceptionReason || exceptionReason.trim().length === 0)) {
    return {
      allowed: false,
      reason: 'A BAP exception requires a written reason.',
    };
  }

  // Default: block
  return {
    allowed: false,
    reason:
      'Stage 1 BAP must be Completed or Scheduled before progressing past Enquiry. You may record an exception with a reason to bypass this requirement.',
  };
}
