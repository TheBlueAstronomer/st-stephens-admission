'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { serializeAuditFields, serializeAuditScalar } from '@/lib/audit-log';
import { requireRole } from '@/lib/require-role';
import {
  scheduleInterviewSchema,
  recordOutcomeSchema,
  saveNotesSchema,
  type ScheduleInterviewInput,
  type RecordOutcomeInput,
  type SaveNotesInput,
} from '@/lib/validations/interview';
import { validateBAPGate } from '@/lib/business-rules/bap-gate';
import { authorizeInterviewAccess } from '@/lib/business-rules/interview-access';
import type { InterviewOutcome, InterviewType } from '@/generated/prisma/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Schedule Interview (US-01 + US-02) ─────────────────────────────────────

export async function scheduleInterview(
  input: ScheduleInterviewInput,
): Promise<ActionResult<{ interviewId: string }>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  // Validate input
  const parsed = scheduleInterviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: Object.values(parsed.error.flatten().fieldErrors).flat().join('; ') || 'Validation failed.',
    };
  }

  const data = parsed.data;

  // Fetch applicant with BAP status
  const applicant = await prisma.applicant.findUnique({
    where: { id: data.applicantId },
    include: { bapStatus: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  // BAP prerequisite validation (US-02)
  const bapStatus = applicant.bapStatus;
  const stageOneStatus = bapStatus?.stageOneStatus ?? 'INCOMPLETE';
  const bapResult = validateBAPGate({
    stageOneStatus,
    hasException: applicant.hasStageOneBAPException,
    exceptionReason: applicant.stageOneBAPExceptionReason,
  });

  if (!bapResult.allowed) {
    return {
      success: false,
      error: bapResult.reason ?? 'Stage 1 BAP prerequisite not met.',
    };
  }

  // Validate that assigned users are academic staff
  const interviewers = await prisma.user.findMany({
    where: {
      id: { in: data.interviewerIds },
      role: 'ACADEMIC_STAFF',
      isActive: true,
    },
    select: { id: true },
  });

  if (interviewers.length !== data.interviewerIds.length) {
    return {
      success: false,
      error: 'One or more assigned interviewers are not active academic staff.',
    };
  }

  // Create interview + panel + status transition + audit log in transaction
  const interview = await prisma.$transaction(async (tx) => {
    const newInterview = await tx.interview.create({
      data: {
        applicantId: data.applicantId,
        interviewType: data.interviewType as InterviewType,
        scheduledAt: new Date(data.scheduledAt),
        status: 'SCHEDULED',
        createdByUserId: session?.user?.id ?? null,
      },
    });

    // Create panel member records
    for (const userId of data.interviewerIds) {
      await tx.interviewPanel.create({
        data: {
          interviewId: newInterview.id,
          userId,
        },
      });
    }

    // Transition applicant status to INTERVIEW_SCHEDULED
    await tx.applicant.update({
      where: { id: data.applicantId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });

    // Audit log — interview scheduled
    await tx.auditLog.create({
      data: {
        applicantId: data.applicantId,
        entityType: 'Interview',
        entityId: newInterview.id,
        action: 'INTERVIEW_SCHEDULED',
        newValue: serializeAuditFields('Scheduled interview', {
          interviewId: newInterview.id,
          interviewType: data.interviewType,
          scheduledAt: data.scheduledAt,
          interviewerCount: data.interviewerIds.length,
        }, { type: 'Interview', id: newInterview.id }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    return newInterview;
  });

  revalidatePath(`/applicants/${data.applicantId}`);
  revalidatePath('/applicants');
  revalidatePath('/interviews');

  return { success: true, data: { interviewId: interview.id } };
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
    return {
      success: false,
      error: Object.values(parsed.error.flatten().fieldErrors).flat().join('; ') || 'Validation failed.',
    };
  }

  const data = parsed.data;

  // Fetch interview with panel members
  const interview = await prisma.interview.findUnique({
    where: { id: data.interviewId },
    include: {
      panelMembers: { select: { userId: true } },
      applicant: { select: { id: true, status: true } },
    },
  });

  if (!interview) {
    return { success: false, error: 'Interview not found.' };
  }

  // US-04: Block outcome without scheduled date
  if (!interview.scheduledAt) {
    return {
      success: false,
      error: 'An interview must be scheduled before recording an outcome.',
    };
  }

  // US-05: Check assignment access
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  if (!userId || !userRole) {
    return { success: false, error: 'Authentication required.' };
  }

  const accessResult = authorizeInterviewAccess({
    userId,
    userRole,
    assignedUserIds: interview.panelMembers.map((p) => p.userId),
  });

  if (!accessResult.allowed) {
    return { success: false, error: accessResult.reason ?? 'Access denied.' };
  }

  // Update interview + applicant status in transaction
  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: data.interviewId },
      data: {
        outcome: data.outcome as InterviewOutcome,
        notes: data.notes || null,
        followUpActions: data.followUpActions || null,
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedByUserId: userId,
      },
    });

    // Transition applicant status to INTERVIEW_COMPLETED
    await tx.applicant.update({
      where: { id: interview.applicant.id },
      data: { status: 'INTERVIEW_COMPLETED' },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        applicantId: interview.applicant.id,
        entityType: 'Interview',
        entityId: interview.id,
        action: 'INTERVIEW_OUTCOME',
        previousValue: serializeAuditScalar('status', interview.status),
        newValue: serializeAuditFields('Recorded interview outcome', {
          outcome: data.outcome,
          notes: data.notes,
          followUpActions: data.followUpActions,
        }, { type: 'Interview', id: interview.id }),
        performedByUserId: userId,
      },
    });
  });

  revalidatePath(`/interviews/${data.interviewId}`);
  revalidatePath(`/applicants/${interview.applicant.id}`);
  revalidatePath('/applicants');
  revalidatePath('/interviews');

  return { success: true };
}

// ─── Save Interview Notes (partial save) ────────────────────────────────────

export async function saveInterviewNotes(
  input: SaveNotesInput,
): Promise<ActionResult> {
  await requireRole('ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const parsed = saveNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.' };
  }

  const data = parsed.data;

  const interview = await prisma.interview.findUnique({
    where: { id: data.interviewId },
    include: { panelMembers: { select: { userId: true } } },
  });

  if (!interview) {
    return { success: false, error: 'Interview not found.' };
  }

  // Check access
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  if (!userId || !userRole) {
    return { success: false, error: 'Authentication required.' };
  }

  const accessResult = authorizeInterviewAccess({
    userId,
    userRole,
    assignedUserIds: interview.panelMembers.map((p) => p.userId),
  });

  if (!accessResult.allowed) {
    return { success: false, error: accessResult.reason ?? 'Access denied.' };
  }

  await prisma.interview.update({
    where: { id: data.interviewId },
    data: {
      notes: data.notes || null,
      followUpActions: data.followUpActions || null,
      updatedByUserId: userId,
    },
  });

  revalidatePath(`/interviews/${data.interviewId}`);

  return { success: true };
}

// ─── Mark Invitation Sent (US-07) ───────────────────────────────────────────

export async function markInvitationSent(
  interviewId: string,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { applicant: { select: { id: true } } },
  });

  if (!interview) {
    return { success: false, error: 'Interview not found.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: interviewId },
      data: {
        invitationSentAt: new Date(),
        invitationSentByUserId: session?.user?.id ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        applicantId: interview.applicant.id,
        entityType: 'Interview',
        entityId: interviewId,
        action: 'INVITATION_SENT',
        newValue: serializeAuditFields('Marked invitation as sent', {
          interviewId,
          sentAt: new Date().toISOString(),
          sentByUserId: session?.user?.id,
        }, { type: 'Interview', id: interviewId }),
        performedByUserId: session?.user?.id ?? null,
      },
    });
  });

  revalidatePath(`/interviews/${interviewId}`);
  revalidatePath(`/applicants/${interview.applicant.id}`);

  return { success: true };
}

// ─── Mark Application Received (US-08) ──────────────────────────────────────

export async function markApplicationReceived(
  interviewId: string,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { applicant: { select: { id: true, status: true } } },
  });

  if (!interview) {
    return { success: false, error: 'Interview not found.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: interviewId },
      data: {
        interviewApplicationReceivedAt: new Date(),
      },
    });

    // Transition applicant status if appropriate
    if (interview.applicant.status === 'VISIT_INVITED') {
      await tx.applicant.update({
        where: { id: interview.applicant.id },
        data: { status: 'INTERVIEW_APPLICATION_RECEIVED' },
      });
    }

    await tx.auditLog.create({
      data: {
        applicantId: interview.applicant.id,
        entityType: 'Interview',
        entityId: interviewId,
        action: 'APPLICATION_RECEIVED',
        newValue: serializeAuditFields('Marked interview application as received', {
          interviewId,
          receivedAt: new Date().toISOString(),
        }, { type: 'Interview', id: interviewId }),
        performedByUserId: session?.user?.id ?? null,
      },
    });
  });

  revalidatePath(`/interviews/${interviewId}`);
  revalidatePath(`/applicants/${interview.applicant.id}`);
  revalidatePath('/applicants');

  return { success: true };
}
