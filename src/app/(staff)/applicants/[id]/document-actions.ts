'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/db';
import {
  actionSuccess,
  actionError,
  validationError,
  type ActionResult,
} from '@/lib/action-result';
import {
  markDocumentReceivedSchema,
  waiveDocumentSchema,
  clearDocumentStatusSchema,
  type MarkDocumentReceivedInput,
  type WaiveDocumentInput,
  type ClearDocumentStatusInput,
} from '@/lib/validations/document';
import { uploadToSharePoint, createSharePointFolder } from '@/lib/services/microsoft-graph';

// ─── Mark Document Received ──────────────────────────────────────────────────

export async function markDocumentReceived(
  input: MarkDocumentReceivedInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = markDocumentReceivedSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { applicantId, documentTypeId, fileUrl, fileName, receivedAt, notes } = parsed.data;

  try {
    const documentType = await prisma.documentType.findUnique({ where: { id: documentTypeId } });
    if (!documentType) return actionError('Document type not found.');

    await prisma.applicantDocument.upsert({
      where: {
        applicantId_documentTypeId: { applicantId, documentTypeId },
      },
      update: {
        isReceived:  true,
        isWaived:    false,
        receivedAt:  receivedAt ?? new Date(),
        storageUrl:  fileUrl ?? null,
        fileName:    fileName ?? null,
        notes:       notes ?? null,
        storageProvider: fileUrl ? 'SHAREPOINT' : null,
      },
      create: {
        applicantId,
        documentTypeId,
        isRequired:  documentType.isRequired,
        isReceived:  true,
        isWaived:    false,
        receivedAt:  receivedAt ?? new Date(),
        storageUrl:  fileUrl ?? null,
        fileName:    fileName ?? null,
        notes:       notes ?? null,
        storageProvider: fileUrl ? 'SHAREPOINT' : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        applicantId,
        entityType:       'ApplicantDocument',
        entityId:         documentTypeId,
        action:           'DOCUMENT_RECEIVED',
        newValue:         JSON.stringify({ documentType: documentType.name, fileUrl }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath(`/applicants/${applicantId}`);
    return actionSuccess();
  } catch (e) {
    console.error('markDocumentReceived error:', e);
    return actionError('Failed to mark document as received.');
  }
}

// ─── Waive Document ───────────────────────────────────────────────────────────

export async function waiveDocument(
  input: WaiveDocumentInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = waiveDocumentSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { applicantId, documentTypeId, waiverNote } = parsed.data;

  try {
    const documentType = await prisma.documentType.findUnique({ where: { id: documentTypeId } });
    if (!documentType) return actionError('Document type not found.');

    await prisma.applicantDocument.upsert({
      where: {
        applicantId_documentTypeId: { applicantId, documentTypeId },
      },
      update: {
        isWaived:   true,
        isReceived: false,
        waiverNote,
      },
      create: {
        applicantId,
        documentTypeId,
        isRequired:  documentType.isRequired,
        isWaived:    true,
        isReceived:  false,
        waiverNote,
      },
    });

    await prisma.auditLog.create({
      data: {
        applicantId,
        entityType:       'ApplicantDocument',
        entityId:         documentTypeId,
        action:           'DOCUMENT_WAIVED',
        newValue:         JSON.stringify({ documentType: documentType.name, waiverNote }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath(`/applicants/${applicantId}`);
    return actionSuccess();
  } catch (e) {
    console.error('waiveDocument error:', e);
    return actionError('Failed to waive document.');
  }
}

// ─── Upload Document to SharePoint ───────────────────────────────────────────

export async function uploadDocument(formData: FormData): Promise<ActionResult<{ fileUrl: string }>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const applicantId    = formData.get('applicantId') as string;
  const documentTypeId = formData.get('documentTypeId') as string;
  const receivedAtStr  = formData.get('receivedAt') as string | null;
  const notes          = formData.get('notes') as string | null;
  const file           = formData.get('file') as File | null;

  if (!applicantId || !documentTypeId) {
    return actionError('applicantId and documentTypeId are required.');
  }

  try {
    const documentType = await prisma.documentType.findUnique({ where: { id: documentTypeId } });
    if (!documentType) return actionError('Document type not found.');

    const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
    if (!applicant) return actionError('Applicant not found.');

    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await uploadToSharePoint(applicant.applicantId, file.name, arrayBuffer);
      fileUrl  = result.fileUrl;
      fileName = result.fileName;
    }

    const receivedAt = receivedAtStr ? new Date(receivedAtStr) : new Date();

    await prisma.applicantDocument.upsert({
      where: {
        applicantId_documentTypeId: { applicantId, documentTypeId },
      },
      update: {
        isReceived:  true,
        isWaived:    false,
        receivedAt,
        storageUrl:  fileUrl ?? null,
        fileName:    fileName ?? null,
        notes:       notes ?? null,
        storageProvider: fileUrl ? 'SHAREPOINT' : null,
      },
      create: {
        applicantId,
        documentTypeId,
        isRequired:  documentType.isRequired,
        isReceived:  true,
        isWaived:    false,
        receivedAt,
        storageUrl:  fileUrl ?? null,
        fileName:    fileName ?? null,
        notes:       notes ?? null,
        storageProvider: fileUrl ? 'SHAREPOINT' : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        applicantId,
        entityType:       'ApplicantDocument',
        entityId:         documentTypeId,
        action:           'DOCUMENT_RECEIVED',
        newValue:         JSON.stringify({ documentType: documentType.name, fileUrl, fileName }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    revalidatePath(`/applicants/${applicantId}`);
    return actionSuccess({ fileUrl: fileUrl ?? '' });
  } catch (e) {
    console.error('uploadDocument error:', e);
    return actionError('Failed to upload document. Please try again.');
  }
}

// ─── Clear Document Status ────────────────────────────────────────────────────

export async function clearDocumentStatus(
  input: ClearDocumentStatusInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');

  const parsed = clearDocumentStatusSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { applicantId, documentTypeId } = parsed.data;

  try {
    await prisma.applicantDocument.deleteMany({
      where: { applicantId, documentTypeId },
    });

    revalidatePath(`/applicants/${applicantId}`);
    return actionSuccess();
  } catch (e) {
    console.error('clearDocumentStatus error:', e);
    return actionError('Failed to clear document status.');
  }
}

// ─── Ensure SharePoint Folder ─────────────────────────────────────────────────

export async function ensureSharePointFolder(
  applicantId: string,
): Promise<ActionResult<{ folderUrl: string }>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');

  try {
    const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
    if (!applicant) return actionError('Applicant not found.');

    if (applicant.sharePointFolderUrl) {
      return actionSuccess({ folderUrl: applicant.sharePointFolderUrl });
    }

    const { folderUrl } = await createSharePointFolder(applicant.applicantId);

    await prisma.applicant.update({
      where: { id: applicantId },
      data:  { sharePointFolderUrl: folderUrl },
    });

    revalidatePath(`/applicants/${applicantId}`);
    return actionSuccess({ folderUrl });
  } catch (e) {
    console.error('ensureSharePointFolder error:', e);
    return actionError('Failed to create SharePoint folder.');
  }
}
