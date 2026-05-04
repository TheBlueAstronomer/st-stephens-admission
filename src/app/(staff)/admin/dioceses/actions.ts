'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import { actionSuccess, actionError, type ActionResult } from '@/lib/action-result';

export async function createDiocese(name: string): Promise<ActionResult<{ id: string }>> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  if (!name?.trim()) return actionError('Diocese name is required.');

  try {
    const existing = await prisma.diocese.findUnique({ where: { name: name.trim() } });
    if (existing) return actionError('A diocese with this name already exists.');

    const diocese = await prisma.diocese.create({
      data: { name: name.trim(), isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'Diocese',
        entityId: diocese.id,
        action: 'DIOCESE_CREATED',
        newValue: diocese.name,
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/dioceses');
    revalidatePath('/applicants');
    revalidatePath('/reports');
    return actionSuccess({ id: diocese.id });
  } catch {
    return actionError('Failed to create diocese.');
  }
}

export async function updateDiocese(id: string, name: string): Promise<ActionResult> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  if (!name?.trim()) return actionError('Diocese name is required.');

  try {
    const existing = await prisma.diocese.findUnique({ where: { id } });
    if (!existing) return actionError('Diocese not found.');

    const duplicate = await prisma.diocese.findUnique({ where: { name: name.trim() } });
    if (duplicate && duplicate.id !== id) return actionError('A diocese with this name already exists.');

    await prisma.diocese.update({
      where: { id },
      data: { name: name.trim() },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'Diocese',
        entityId: id,
        action: 'DIOCESE_UPDATED',
        previousValue: existing.name,
        newValue: name.trim(),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/dioceses');
    revalidatePath('/applicants');
    revalidatePath('/reports');
    return actionSuccess();
  } catch {
    return actionError('Failed to update diocese.');
  }
}
