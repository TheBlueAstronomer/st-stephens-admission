import type { UserRole } from '@/generated/prisma/client';

export interface InterviewAccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks if a user is authorised to access an interview record.
 * - ADMISSIONS_STAFF / SYSTEM_ADMINISTRATOR → always allowed.
 * - ACADEMIC_STAFF → allowed only if in the interview's assigned panel.
 */
export function authorizeInterviewAccess(params: {
  userId: string;
  userRole: UserRole;
  assignedUserIds: string[];
}): InterviewAccessResult {
  const { userId, userRole, assignedUserIds } = params;

  if (userRole === 'ADMISSIONS_STAFF' || userRole === 'SYSTEM_ADMINISTRATOR') {
    return { allowed: true };
  }

  if (userRole === 'ACADEMIC_STAFF') {
    if (assignedUserIds.includes(userId)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'You are not assigned to this interview.',
    };
  }

  return {
    allowed: false,
    reason: 'Your role does not have access to interview records.',
  };
}
