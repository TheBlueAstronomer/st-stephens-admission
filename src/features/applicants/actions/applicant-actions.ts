'use server';

import { revalidatePath } from 'next/cache';
import {
  toActionResult,
  type ActionResult,
  validationError,
} from '@/lib/action-result';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import {
  createApplicantSchema,
  updateApplicantBapSchema,
  updateApplicantDetailsSchema,
  updateApplicantEcclesialSchema,
  type CreateApplicantInput,
  type UpdateApplicantBapInput,
  type UpdateApplicantDetailsInput,
  type UpdateApplicantEcclesialInput,
} from '@/features/applicants/validations/applicant';
import {
  createApplicantWorkflow,
  exportApplicantsCsvWorkflow,
  updateApplicantBapWorkflow,
  updateApplicantDetailsWorkflow,
  updateApplicantEcclesialWorkflow,
  updateApplicantStatusWorkflow,
} from '@/features/applicants/services/applicant-workflows';
import type { ApplicantStatus } from '@/generated/prisma/client';

// ─── Create Applicant ───────────────────────────────────────────────────────

export async function createApplicant(
  input: CreateApplicantInput,
): Promise<ActionResult<{ id: string; applicantId: string }>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  // Validate input
  const parsed = createApplicantSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await createApplicantWorkflow(parsed.data, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Update Applicant Status ────────────────────────────────────────────────

export async function updateApplicantStatus(
  applicantId: string,
  targetStatus: ApplicantStatus,
  bapException?: { hasException: boolean; reason?: string },
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const result = await updateApplicantStatusWorkflow(
    applicantId,
    targetStatus,
    session?.user?.id ?? null,
    bapException,
  );

  if (result.success) {
    revalidatePath(`/applicants/${applicantId}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Update Applicant Details ───────────────────────────────────────────────

export async function updateApplicantDetails(
  input: UpdateApplicantDetailsInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = updateApplicantDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await updateApplicantDetailsWorkflow(parsed.data, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${parsed.data.id}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Update Applicant Ecclesial Data ────────────────────────────────────────

export async function updateApplicantEcclesial(
  input: UpdateApplicantEcclesialInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = updateApplicantEcclesialSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await updateApplicantEcclesialWorkflow(parsed.data, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${parsed.data.id}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Update Applicant BAP Data ──────────────────────────────────────────────

export async function updateApplicantBap(
  input: UpdateApplicantBapInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = updateApplicantBapSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await updateApplicantBapWorkflow(parsed.data, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${parsed.data.id}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Export Applicants as CSV ───────────────────────────────────────────────

export async function exportApplicantsCSV(
  filters: Record<string, string | undefined>,
): Promise<ActionResult<string>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');

  return toActionResult(await exportApplicantsCsvWorkflow(filters));
}
