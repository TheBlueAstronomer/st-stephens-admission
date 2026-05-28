'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import { actionSuccess, actionError, type ActionResult } from '@/lib/action-result';

interface CreateAdmissionsYearInput {
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export async function createAdmissionsYear(input: CreateAdmissionsYearInput): Promise<ActionResult<{ id: string }>> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  if (!input.label?.trim()) return actionError('Label is required.');
  if (!input.startDate) return actionError('Start date is required.');
  if (!input.endDate) return actionError('End date is required.');

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (end <= start) return actionError('End date must be after start date.');

  try {
    if (input.isCurrent) {
      await prisma.admissionsYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const year = await prisma.admissionsYear.create({
      data: {
        label: input.label.trim(),
        startDate: start,
        endDate: end,
        isCurrent: input.isCurrent,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'AdmissionsYear',
        entityId: year.id,
        action: 'ADMISSIONS_YEAR_CREATED',
        newValue: JSON.stringify({ label: year.label, isCurrent: year.isCurrent }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/admissions-years');
    revalidatePath('/applicants');
    revalidatePath('/dashboard');
    revalidatePath('/reports');
    return actionSuccess({ id: year.id });
  } catch {
    return actionError('Failed to create admissions year.');
  }
}

export async function setCurrentYear(yearId: string): Promise<ActionResult> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  try {
    const year = await prisma.admissionsYear.findUnique({ where: { id: yearId } });
    if (!year) return actionError('Admissions year not found.');
    if (year.isCurrent) return actionError('This is already the current year.');

    await prisma.admissionsYear.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    });

    await prisma.admissionsYear.update({
      where: { id: yearId },
      data: { isCurrent: true },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'AdmissionsYear',
        entityId: yearId,
        action: 'ADMISSIONS_YEAR_CREATED',
        previousValue: 'not current',
        newValue: `Set ${year.label} as current year`,
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/admissions-years');
    revalidatePath('/applicants');
    revalidatePath('/dashboard');
    return actionSuccess();
  } catch {
    return actionError('Failed to set current year.');
  }
}
