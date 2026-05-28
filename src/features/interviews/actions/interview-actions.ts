'use server';

import { revalidatePath } from 'next/cache';
import {
  toActionResult,
  toVoidActionResult,
  type ActionResult,
  validationError,
} from '@/lib/action-result';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import {
  scheduleInterviewSchema,
  recordOutcomeSchema,
  saveNotesSchema,
  type ScheduleInterviewInput,
  type RecordOutcomeInput,
  type SaveNotesInput,
} from '@/features/interviews/validations/interview';
import {
  markApplicationReceivedWorkflow,
  markInvitationSentWorkflow,
  recordInterviewOutcomeWorkflow,
  saveInterviewNotesWorkflow,
  scheduleInterviewWorkflow,
} from '@/features/interviews/services/interview-workflows';

// ─── Schedule Interview (US-01 + US-02) ─────────────────────────────────────

export async function scheduleInterview(
  input: ScheduleInterviewInput,
): Promise<ActionResult<{ interviewId: string }>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  // Validate input
  const parsed = scheduleInterviewSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await scheduleInterviewWorkflow(parsed.data, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/applicants/${parsed.data.applicantId}`);
    revalidatePath('/applicants');
    revalidatePath('/interviews');
  }

  return toActionResult(result);
}

// ─── Record Interview Outcome (US-03 + US-04) ──────────────────────────────

export async function recordInterviewOutcome(
  input: RecordOutcomeInput,
): Promise<ActionResult> {
  await requireRole('ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  // Validate input
  const parsed = recordOutcomeSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await recordInterviewOutcomeWorkflow(parsed.data, {
    id: session?.user?.id ?? null,
    role: session?.user?.role ?? null,
  });

  if (result.success) {
    revalidatePath(`/interviews/${parsed.data.interviewId}`);
    if (result.data?.applicantId) {
      revalidatePath(`/applicants/${result.data.applicantId}`);
    }
    revalidatePath('/applicants');
    revalidatePath('/interviews');
    return toVoidActionResult(result);
  }

  return toVoidActionResult(result);
}

// ─── Save Interview Notes (partial save) ────────────────────────────────────

export async function saveInterviewNotes(
  input: SaveNotesInput,
): Promise<ActionResult> {
  await requireRole('ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = saveNotesSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const result = await saveInterviewNotesWorkflow(parsed.data, {
    id: session?.user?.id ?? null,
    role: session?.user?.role ?? null,
  });

  if (result.success) {
    revalidatePath(`/interviews/${parsed.data.interviewId}`);
    return toVoidActionResult(result);
  }

  return toVoidActionResult(result);
}

// ─── Mark Invitation Sent (US-07) ───────────────────────────────────────────

export async function markInvitationSent(
  interviewId: string,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const result = await markInvitationSentWorkflow(interviewId, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/interviews/${interviewId}`);
    if (result.data?.applicantId) {
      revalidatePath(`/applicants/${result.data.applicantId}`);
    }
    return toVoidActionResult(result);
  }

  return toVoidActionResult(result);
}

// ─── Mark Application Received (US-08) ──────────────────────────────────────

export async function markApplicationReceived(
  interviewId: string,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const result = await markApplicationReceivedWorkflow(interviewId, session?.user?.id ?? null);

  if (result.success) {
    revalidatePath(`/interviews/${interviewId}`);
    if (result.data?.applicantId) {
      revalidatePath(`/applicants/${result.data.applicantId}`);
    }
    revalidatePath('/applicants');
    return toVoidActionResult(result);
  }

  return toVoidActionResult(result);
}
