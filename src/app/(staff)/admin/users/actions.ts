'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import { actionSuccess, actionError, validationError, type ActionResult } from '@/lib/action-result';
import { createUserSchema, updateUserRoleSchema, type CreateUserInput, type UpdateUserRoleInput } from '@/lib/validations/user';
import type { UserRole } from '@/generated/prisma/client';

// ─── Create User (US-02) ────────────────────────────────────────────────────

export async function createUser(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return actionError('A user with this email already exists.');

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role as UserRole,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: user.id,
        action: 'USER_CREATED',
        newValue: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/users');
    return actionSuccess({ id: user.id });
  } catch {
    return actionError('Failed to create user.');
  }
}

// ─── Deactivate User (US-03) ────────────────────────────────────────────────

export async function deactivateUser(userId: string): Promise<ActionResult> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return actionError('User not found.');
    if (!user.isActive) return actionError('User is already inactive.');

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: userId,
        action: 'USER_DEACTIVATED',
        previousValue: 'active',
        newValue: 'inactive',
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/users');
    return actionSuccess();
  } catch {
    return actionError('Failed to deactivate user.');
  }
}

// ─── Reactivate User ────────────────────────────────────────────────────────

export async function reactivateUser(userId: string): Promise<ActionResult> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return actionError('User not found.');
    if (user.isActive) return actionError('User is already active.');

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: userId,
        action: 'USER_REACTIVATED',
        previousValue: 'inactive',
        newValue: 'active',
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/users');
    return actionSuccess();
  } catch {
    return actionError('Failed to reactivate user.');
  }
}

// ─── Update User Role (US-04) ───────────────────────────────────────────────

export async function updateUserRole(input: UpdateUserRoleInput): Promise<ActionResult> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!user) return actionError('User not found.');

    const previousRole = user.role;
    if (previousRole === parsed.data.newRole) {
      return actionError('Role is already set to this value.');
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.newRole as UserRole },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: parsed.data.userId,
        action: 'ROLE_CHANGED',
        previousValue: previousRole,
        newValue: parsed.data.newRole,
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/users');
    return actionSuccess();
  } catch {
    return actionError('Failed to update user role.');
  }
}
