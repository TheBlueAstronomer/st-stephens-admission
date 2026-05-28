'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import { actionSuccess, actionError, type ActionResult } from '@/lib/action-result';
import type { AwardingFramework, ModeOfStudy } from '@/generated/prisma/client';

interface CreateProgrammeInput {
  courseTitle: string;
  awardingFramework: AwardingFramework;
  modeOfStudy: ModeOfStudy;
  durationOfStudy?: string;
}

export async function createProgramme(input: CreateProgrammeInput): Promise<ActionResult<{ id: string }>> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  if (!input.courseTitle?.trim()) return actionError('Course title is required.');

  try {
    const programme = await prisma.academicProgramme.create({
      data: {
        courseTitle: input.courseTitle.trim(),
        awardingFramework: input.awardingFramework,
        modeOfStudy: input.modeOfStudy,
        durationOfStudy: input.durationOfStudy?.trim() || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'AcademicProgramme',
        entityId: programme.id,
        action: 'PROGRAMME_CREATED',
        newValue: JSON.stringify({ courseTitle: programme.courseTitle, framework: programme.awardingFramework }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/programmes');
    return actionSuccess({ id: programme.id });
  } catch {
    return actionError('Failed to create programme.');
  }
}

export async function updateProgramme(
  id: string,
  data: Partial<CreateProgrammeInput> & { isActive?: boolean },
): Promise<ActionResult> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  try {
    const existing = await prisma.academicProgramme.findUnique({ where: { id } });
    if (!existing) return actionError('Programme not found.');

    const programme = await prisma.academicProgramme.update({
      where: { id },
      data: {
        ...(data.courseTitle !== undefined && { courseTitle: data.courseTitle.trim() }),
        ...(data.awardingFramework !== undefined && { awardingFramework: data.awardingFramework }),
        ...(data.modeOfStudy !== undefined && { modeOfStudy: data.modeOfStudy }),
        ...(data.durationOfStudy !== undefined && { durationOfStudy: data.durationOfStudy?.trim() || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    const action = data.isActive === false
      ? 'PROGRAMME_DEACTIVATED' as const
      : data.isActive === true && !existing.isActive
        ? 'PROGRAMME_REACTIVATED' as const
        : 'PROGRAMME_UPDATED' as const;

    await prisma.auditLog.create({
      data: {
        entityType: 'AcademicProgramme',
        entityId: id,
        action,
        previousValue: JSON.stringify({ courseTitle: existing.courseTitle, isActive: existing.isActive }),
        newValue: JSON.stringify({ courseTitle: programme.courseTitle, isActive: programme.isActive }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/programmes');
    revalidatePath('/applicants');
    return actionSuccess();
  } catch {
    return actionError('Failed to update programme.');
  }
}
