'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import {
  actionSuccess,
  actionError,
  validationError,
  toActionResult,
  type ActionResult,
} from '@/lib/action-result';
import {
  markDocumentReceivedSchema,
  waiveDocumentSchema,
  clearDocumentStatusSchema,
  type MarkDocumentReceivedInput,
  type WaiveDocumentInput,
  type ClearDocumentStatusInput,
} from '@/features/documents/validations/document';
import {
  clearDocumentFulfilmentWorkflow,
  ensureSharePointFolderWorkflow,
  markDocumentReceivedWorkflow,
  uploadDocumentWorkflow,
  waiveDocumentWorkflow,
} from '@/features/documents/services/document-fulfilment';

// ─── Mark Document Received ──────────────────────────────────────────────────

export async function markDocumentReceived(
  input: MarkDocumentReceivedInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = markDocumentReceivedSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await markDocumentReceivedWorkflow(parsed.data, session?.user?.id ?? null);
    if (!result.success) return toActionResult(result);

    revalidatePath(`/applicants/${parsed.data.applicantId}`);
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

  try {
    const result = await waiveDocumentWorkflow(parsed.data, session?.user?.id ?? null);
    if (!result.success) return toActionResult(result);

    revalidatePath(`/applicants/${parsed.data.applicantId}`);
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
    const receivedAt = receivedAtStr ? new Date(receivedAtStr) : new Date();
    const result = await uploadDocumentWorkflow(
      {
        applicantId,
        documentTypeId,
        receivedAt,
        notes,
        file,
      },
      session?.user?.id ?? null,
    );
    if (!result.success) return toActionResult(result);

    revalidatePath(`/applicants/${applicantId}`);
    return actionSuccess(result.data);
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

  const { applicantId } = parsed.data;
  const session = await auth();

  try {
    const result = await clearDocumentFulfilmentWorkflow(parsed.data, session?.user?.id ?? null);
    if (!result.success) return toActionResult(result);

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
    const result = await ensureSharePointFolderWorkflow(applicantId);
    if (!result.success) return toActionResult(result);

    revalidatePath(`/applicants/${applicantId}`);
    return actionSuccess(result.data);
  } catch (e) {
    console.error('ensureSharePointFolder error:', e);
    return actionError('Failed to create SharePoint folder.');
  }
}
