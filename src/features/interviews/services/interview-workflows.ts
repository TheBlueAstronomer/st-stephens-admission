import { prisma } from '@/lib/db';
import { serializeAuditFields, serializeAuditScalar } from '@/lib/audit-log';
import { validateBAPGate } from '@/features/admissions-lifecycle/business-rules/bap-gate';
import { authorizeInterviewAccess } from '@/features/interviews/business-rules/interview-access';
import type { InterviewOutcome, InterviewType, UserRole } from '@/generated/prisma/client';
import type {
  RecordOutcomeInput,
  SaveNotesInput,
  ScheduleInterviewInput,
} from '@/features/interviews/validations/interview';

export interface InterviewWorkflowResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function scheduleInterviewWorkflow(
  data: ScheduleInterviewInput,
  performedByUserId?: string | null,
): Promise<InterviewWorkflowResult<{ interviewId: string }>> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: data.applicantId },
    include: { bapStatus: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  const stageOneStatus = applicant.bapStatus?.stageOneStatus ?? 'INCOMPLETE';
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

  const interview = await prisma.$transaction(async (tx) => {
    const newInterview = await tx.interview.create({
      data: {
        applicantId: data.applicantId,
        interviewType: data.interviewType as InterviewType,
        scheduledAt: new Date(data.scheduledAt),
        status: 'SCHEDULED',
        createdByUserId: performedByUserId ?? null,
      },
    });

    for (const userId of data.interviewerIds) {
      await tx.interviewPanel.create({
        data: {
          interviewId: newInterview.id,
          userId,
        },
      });
    }

    await tx.applicant.update({
      where: { id: data.applicantId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });

    await tx.auditLog.create({
      data: {
        applicantId: data.applicantId,
        entityType: 'Interview',
        entityId: newInterview.id,
        action: 'INTERVIEW_SCHEDULED',
        newValue: serializeAuditFields(
          'Scheduled interview',
          {
            interviewId: newInterview.id,
            interviewType: data.interviewType,
            scheduledAt: data.scheduledAt,
            interviewerCount: data.interviewerIds.length,
          },
          { type: 'Interview', id: newInterview.id },
        ),
        performedByUserId: performedByUserId ?? null,
      },
    });

    return newInterview;
  });

  return { success: true, data: { interviewId: interview.id } };
}

export async function recordInterviewOutcomeWorkflow(
  data: RecordOutcomeInput,
  user: { id?: string | null; role?: UserRole | null },
): Promise<InterviewWorkflowResult<{ applicantId: string }>> {
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

  if (!interview.scheduledAt) {
    return {
      success: false,
      error: 'An interview must be scheduled before recording an outcome.',
    };
  }

  if (!user.id || !user.role) {
    return { success: false, error: 'Authentication required.' };
  }

  const accessResult = authorizeInterviewAccess({
    userId: user.id,
    userRole: user.role,
    assignedUserIds: interview.panelMembers.map((p) => p.userId),
  });

  if (!accessResult.allowed) {
    return { success: false, error: accessResult.reason ?? 'Access denied.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: data.interviewId },
      data: {
        outcome: data.outcome as InterviewOutcome,
        notes: data.notes || null,
        followUpActions: data.followUpActions || null,
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedByUserId: user.id,
      },
    });

    await tx.applicant.update({
      where: { id: interview.applicant.id },
      data: { status: 'INTERVIEW_COMPLETED' },
    });

    await tx.auditLog.create({
      data: {
        applicantId: interview.applicant.id,
        entityType: 'Interview',
        entityId: interview.id,
        action: 'INTERVIEW_OUTCOME',
        previousValue: serializeAuditScalar('status', interview.status),
        newValue: serializeAuditFields(
          'Recorded interview outcome',
          {
            outcome: data.outcome,
            notes: data.notes,
            followUpActions: data.followUpActions,
          },
          { type: 'Interview', id: interview.id },
        ),
        performedByUserId: user.id,
      },
    });
  });

  return { success: true, data: { applicantId: interview.applicant.id } };
}

export async function saveInterviewNotesWorkflow(
  data: SaveNotesInput,
  user: { id?: string | null; role?: UserRole | null },
): Promise<InterviewWorkflowResult> {
  const interview = await prisma.interview.findUnique({
    where: { id: data.interviewId },
    include: { panelMembers: { select: { userId: true } } },
  });

  if (!interview) {
    return { success: false, error: 'Interview not found.' };
  }

  if (!user.id || !user.role) {
    return { success: false, error: 'Authentication required.' };
  }

  const accessResult = authorizeInterviewAccess({
    userId: user.id,
    userRole: user.role,
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
      updatedByUserId: user.id,
    },
  });

  return { success: true };
}

export async function markInvitationSentWorkflow(
  interviewId: string,
  performedByUserId?: string | null,
): Promise<InterviewWorkflowResult<{ applicantId: string }>> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { applicant: { select: { id: true } } },
  });

  if (!interview) {
    return { success: false, error: 'Interview not found.' };
  }

  const sentAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: interviewId },
      data: {
        invitationSentAt: sentAt,
        invitationSentByUserId: performedByUserId ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        applicantId: interview.applicant.id,
        entityType: 'Interview',
        entityId: interviewId,
        action: 'INVITATION_SENT',
        newValue: serializeAuditFields(
          'Marked invitation as sent',
          {
            interviewId,
            sentAt: sentAt.toISOString(),
            sentByUserId: performedByUserId,
          },
          { type: 'Interview', id: interviewId },
        ),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true, data: { applicantId: interview.applicant.id } };
}

export async function markApplicationReceivedWorkflow(
  interviewId: string,
  performedByUserId?: string | null,
): Promise<InterviewWorkflowResult<{ applicantId: string }>> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { applicant: { select: { id: true, status: true } } },
  });

  if (!interview) {
    return { success: false, error: 'Interview not found.' };
  }

  const receivedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: interviewId },
      data: {
        interviewApplicationReceivedAt: receivedAt,
      },
    });

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
        newValue: serializeAuditFields(
          'Marked interview application as received',
          {
            interviewId,
            receivedAt: receivedAt.toISOString(),
          },
          { type: 'Interview', id: interviewId },
        ),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true, data: { applicantId: interview.applicant.id } };
}
