import { auth } from '@/lib/auth';
import type { UserRole } from '@/generated/prisma/client';

export class AuthorizationError extends Error {
  public readonly statusCode = 403;

  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Guard for server actions. Call at the top of any mutation server action.
 * Throws AuthorizationError if the session role is not in the allowed list.
 *
 * @example
 * async function createApplicant(data: FormData) {
 *   'use server';
 *   await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
 *   // ... mutation logic
 * }
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<void> {
  const session = await auth();

  if (!session?.user) {
    throw new AuthorizationError('Authentication required.');
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new AuthorizationError(
      `Role '${session.user.role}' is not authorised for this action. Required: ${allowedRoles.join(', ')}.`,
    );
  }
}
