import type { ApplicantStatus } from '@/generated/prisma/client';

/**
 * Valid status transitions for the admissions workflow.
 * Each key maps to an array of statuses it can transition TO.
 */
export const VALID_TRANSITIONS: Record<ApplicantStatus, ApplicantStatus[]> = {
  ENQUIRY: ['VISIT_INVITED', 'WITHDRAWN'],
  VISIT_INVITED: ['INTERVIEW_APPLICATION_RECEIVED', 'WITHDRAWN'],
  INTERVIEW_APPLICATION_RECEIVED: ['INTERVIEW_SCHEDULED', 'WITHDRAWN'],
  INTERVIEW_SCHEDULED: ['INTERVIEW_COMPLETED', 'WITHDRAWN'],
  INTERVIEW_COMPLETED: ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'DECLINED', 'WITHDRAWN'],
  CONDITIONAL_OFFER: ['UNCONDITIONAL_OFFER', 'REGISTRATION_FORM_RECEIVED', 'DECLINED', 'WITHDRAWN'],
  UNCONDITIONAL_OFFER: ['REGISTRATION_FORM_RECEIVED', 'DECLINED', 'WITHDRAWN'],
  DECLINED: [],
  WITHDRAWN: [],
  REGISTRATION_FORM_RECEIVED: ['DOCUMENTS_COMPLETE', 'WITHDRAWN'],
  DOCUMENTS_COMPLETE: ['CONFIRMED_ORDINAND', 'WITHDRAWN'],
  CONFIRMED_ORDINAND: [],
};

/**
 * Statuses beyond ENQUIRY that require the BAP gate check.
 */
export const STATUSES_REQUIRING_BAP_CHECK: ApplicantStatus[] = [
  'VISIT_INVITED',
  'INTERVIEW_APPLICATION_RECEIVED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
  'REGISTRATION_FORM_RECEIVED',
  'DOCUMENTS_COMPLETE',
  'CONFIRMED_ORDINAND',
];

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a status transition is valid per the workflow map.
 */
export function isValidTransition(
  from: ApplicantStatus,
  to: ApplicantStatus,
): TransitionValidationResult {
  const allowedTargets = VALID_TRANSITIONS[from];

  if (!allowedTargets || allowedTargets.length === 0) {
    return {
      allowed: false,
      reason: `Status '${from}' is a terminal status and cannot be changed.`,
    };
  }

  if (!allowedTargets.includes(to)) {
    return {
      allowed: false,
      reason: `Cannot transition from '${from}' to '${to}'. Valid transitions: ${allowedTargets.join(', ')}.`,
    };
  }

  return { allowed: true };
}

/**
 * Whether the target status requires BAP gate validation.
 */
export function requiresBAPCheck(targetStatus: ApplicantStatus): boolean {
  return STATUSES_REQUIRING_BAP_CHECK.includes(targetStatus);
}
