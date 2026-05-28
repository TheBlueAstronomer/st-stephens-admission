'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import { actionSuccess, actionError, type ActionResult } from '@/lib/action-result';

interface CreateDocumentTypeInput {
  name: string;
  slug: string;
  isRequired: boolean;
  isSensitive: boolean;
}

export async function createDocumentType(input: CreateDocumentTypeInput): Promise<ActionResult<{ id: string }>> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  if (!input.name?.trim()) return actionError('Name is required.');
  if (!input.slug?.trim()) return actionError('Internal key is required.');

  try {
    const existingSlug = await prisma.documentType.findUnique({ where: { slug: input.slug.trim() } });
    if (existingSlug) return actionError('A document type with this key already exists.');

    const existingName = await prisma.documentType.findUnique({ where: { name: input.name.trim() } });
    if (existingName) return actionError('A document type with this name already exists.');

    const dt = await prisma.documentType.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim().toUpperCase(),
        isRequired: input.isRequired,
        isSensitive: input.isSensitive,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'DocumentType',
        entityId: dt.id,
        action: 'DOCUMENT_TYPE_CREATED',
        newValue: JSON.stringify({ name: dt.name, slug: dt.slug }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/document-types');
    return actionSuccess({ id: dt.id });
  } catch {
    return actionError('Failed to create document type.');
  }
}

export async function updateDocumentType(
  id: string,
  data: { name?: string; isRequired?: boolean; isSensitive?: boolean; isActive?: boolean },
): Promise<ActionResult> {
  await requireRole('SYSTEM_ADMINISTRATOR');
  const session = await auth();

  try {
    const existing = await prisma.documentType.findUnique({ where: { id } });
    if (!existing) return actionError('Document type not found.');

    if (data.name !== undefined) {
      const dup = await prisma.documentType.findUnique({ where: { name: data.name.trim() } });
      if (dup && dup.id !== id) return actionError('A document type with this name already exists.');
    }

    const updated = await prisma.documentType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.isSensitive !== undefined && { isSensitive: data.isSensitive }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'DocumentType',
        entityId: id,
        action: 'DOCUMENT_TYPE_UPDATED',
        previousValue: JSON.stringify({ name: existing.name, isRequired: existing.isRequired, isSensitive: existing.isSensitive }),
        newValue: JSON.stringify({ name: updated.name, isRequired: updated.isRequired, isSensitive: updated.isSensitive }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath('/admin/document-types');
    return actionSuccess();
  } catch {
    return actionError('Failed to update document type.');
  }
}
