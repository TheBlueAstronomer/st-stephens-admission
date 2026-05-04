import { z } from 'zod/v4';

export const userRoles = [
  'ADMISSIONS_STAFF',
  'ACADEMIC_STAFF',
  'SENIOR_LEADERSHIP',
  'SYSTEM_ADMINISTRATOR',
] as const;

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.email('Valid email is required'),
  role: z.enum(userRoles, { message: 'Please select a role' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum(userRoles, { message: 'Please select a role' }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
