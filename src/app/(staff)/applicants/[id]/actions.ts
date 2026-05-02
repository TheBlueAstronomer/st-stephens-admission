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
  createOfferSchema,
  acceptOfferSchema,
  type CreateOfferInput,
  type AcceptOfferInput,
} from '@/lib/validations/offer';
import {
  createOfferWorkflow,
  acceptOfferWorkflow,
  markRegistrationReceivedWorkflow,
  confirmOrdinandWorkflow,
} from '@/lib/services/offer-workflows';

// ─── Create / Update Offer Decision ─────────────────────────────────────────

export async function createOffer(
  input: CreateOfferInput,
): Promise<ActionResult<{ offerId: string }>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = createOfferSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await createOfferWorkflow(parsed.data, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${parsed.data.applicantId}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Accept Offer ────────────────────────────────────────────────────────────

export async function acceptOffer(
  input: AcceptOfferInput,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = acceptOfferSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await acceptOfferWorkflow(parsed.data, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${parsed.data.applicantId}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Mark Registration Received ──────────────────────────────────────────────

export async function markRegistrationReceived(
  applicantId: string,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const result = await markRegistrationReceivedWorkflow(applicantId, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${applicantId}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}

// ─── Confirm Ordinand ─────────────────────────────────────────────────────────

export async function confirmOrdinand(
  applicantId: string,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const result = await confirmOrdinandWorkflow(applicantId, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${applicantId}`);
    revalidatePath('/applicants');
  }

  return toActionResult(result);
}
