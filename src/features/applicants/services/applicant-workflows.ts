import { prisma } from '@/lib/db';
import { serializeAuditFields, serializeAuditScalar } from '@/lib/audit-log';
import { generateApplicantId } from '@/features/applicants/services/applicant-id';
import { validateBAPGate } from '@/features/admissions-lifecycle/business-rules/bap-gate';
import {
  isValidTransition,
  requiresBAPCheck,
  requiresInterviewCheck,
} from '@/features/admissions-lifecycle/business-rules/status-transitions';
import { validateInterviewGate } from '@/features/interviews/business-rules/interview-gate';
import { buildWhereClause } from '@/features/applicants/queries/applicant-filters';
import type {
  ApplicantStatus,
  BAPStageStatus,
  Prisma,
} from '@/generated/prisma/client';
import type {
  CreateApplicantInput,
  UpdateApplicantBapInput,
  UpdateApplicantDetailsInput,
  UpdateApplicantEcclesialInput,
} from '@/features/applicants/validations/applicant';

export interface ApplicantWorkflowResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

type AuditFieldChange = {
  field: string;
  previousValue: unknown;
  newValue: unknown;
};

function toOptionalString(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

function toOptionalDate(value: string | undefined) {
  return value && value.length > 0 ? new Date(value) : null;
}

function buildAuditFieldChanges(current: Record<string, unknown>, next: Record<string, unknown>) {
  return Object.entries(next).reduce<AuditFieldChange[]>((changes, [field, newValue]) => {
    const previousValue = current[field];
    const normalizedPrevious = previousValue instanceof Date ? previousValue.toISOString() : previousValue;
    const normalizedNext = newValue instanceof Date ? newValue.toISOString() : newValue;

    if (normalizedPrevious === normalizedNext) {
      return changes;
    }

    changes.push({ field, previousValue: normalizedPrevious, newValue: normalizedNext });
    return changes;
  }, []);
}

async function createApplicantFieldAuditLogs(
  tx: Prisma.TransactionClient,
  applicantId: string,
  changes: AuditFieldChange[],
  performedByUserId: string | null | undefined,
  entityType: 'Applicant' | 'EcclesialProfile' | 'BAPStatus',
  entityId: string,
) {
  for (const change of changes) {
    await tx.auditLog.create({
      data: {
        applicantId,
        entityType,
        entityId,
        action: 'UPDATE',
        previousValue: serializeAuditScalar(change.field, change.previousValue),
        newValue: serializeAuditScalar(change.field, change.newValue),
        performedByUserId: performedByUserId ?? null,
      },
    });
  }
}

export async function createApplicantWorkflow(
  data: CreateApplicantInput,
  performedByUserId?: string | null,
): Promise<ApplicantWorkflowResult<{ id: string; applicantId: string }>> {
  let warning: string | undefined;

  if (data.email) {
    const existing = await prisma.applicant.findFirst({
      where: { email: data.email },
      select: { applicantId: true, legalName: true },
    });
    if (existing) {
      warning = `An applicant with email "${data.email}" already exists (${existing.legalName}, ${existing.applicantId}). The record will still be created.`;
    }
  }

  const admissionsYear = await prisma.admissionsYear.findUnique({
    where: { id: data.admissionsYearId },
    select: { label: true },
  });
  const yearStr = admissionsYear?.label?.match(/\d{4}/)?.[0];
  const applicantId = await generateApplicantId(yearStr);

  const applicant = await prisma.$transaction(async (tx) => {
    const newApplicant = await tx.applicant.create({
      data: {
        applicantId,
        legalName: data.legalName,
        preferredName: data.preferredName || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        email: data.email,
        phone: data.phone || null,
        addressLineOne: data.addressLineOne || null,
        addressLineTwo: data.addressLineTwo || null,
        city: data.city || null,
        postcode: data.postcode || null,
        country: data.country || null,
        status: 'ENQUIRY',
        admissionsYearId: data.admissionsYearId,
        programmeId: data.programmeId,
        dioceseId: data.dioceseId || null,
      },
    });

    if (data.directorOfOrdinandsName || data.directorOfOrdinandsEmail) {
      await tx.ecclesialProfile.create({
        data: {
          applicantId: newApplicant.id,
          directorOfOrdinandsName: data.directorOfOrdinandsName || null,
          directorOfOrdinandsEmail: data.directorOfOrdinandsEmail || null,
          directorOfOrdinandsPhone: data.directorOfOrdinandsPhone || null,
          dioceseId: data.dioceseId || null,
        },
      });
    }

    if (data.stageOneStatus) {
      await tx.bAPStatus.create({
        data: {
          applicantId: newApplicant.id,
          stageOneStatus: data.stageOneStatus as BAPStageStatus,
          stageOneDate: data.stageOneDate ? new Date(data.stageOneDate) : null,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        applicantId: newApplicant.id,
        entityType: 'Applicant',
        entityId: newApplicant.id,
        action: 'CREATE',
        newValue: serializeAuditFields(
          'Created applicant record',
          {
            applicantId,
            legalName: data.legalName,
            email: data.email,
            status: 'ENQUIRY',
          },
          { type: 'Applicant', id: newApplicant.id },
        ),
        performedByUserId: performedByUserId ?? null,
      },
    });

    return newApplicant;
  });

  return {
    success: true,
    data: { id: applicant.id, applicantId: applicant.applicantId },
    warning,
  };
}

export async function updateApplicantStatusWorkflow(
  applicantId: string,
  targetStatus: ApplicantStatus,
  performedByUserId?: string | null,
  bapException?: { hasException: boolean; reason?: string },
): Promise<ApplicantWorkflowResult> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { bapStatus: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  const transitionResult = isValidTransition(applicant.status, targetStatus);
  if (!transitionResult.allowed) {
    return { success: false, error: transitionResult.reason };
  }

  if (requiresBAPCheck(targetStatus)) {
    const bapStatus = applicant.bapStatus;
    const stageOneStatus = bapStatus?.stageOneStatus ?? 'INCOMPLETE';
    const hasException = bapException?.hasException ?? applicant.hasStageOneBAPException;
    const exceptionReason = bapException?.reason ?? applicant.stageOneBAPExceptionReason;

    const gateResult = validateBAPGate({
      stageOneStatus,
      hasException,
      exceptionReason,
    });

    if (!gateResult.allowed) {
      return { success: false, error: gateResult.reason };
    }

    if (bapException?.hasException && bapException.reason) {
      await prisma.$transaction(async (tx) => {
        await tx.bAPStatus.upsert({
          where: { applicantId },
          update: {
            hasStageOneBAPException: true,
            stageOneBAPExceptionReason: bapException.reason,
          },
          create: {
            applicantId,
            hasStageOneBAPException: true,
            stageOneBAPExceptionReason: bapException.reason,
            stageOneStatus: applicant.bapStatus?.stageOneStatus ?? 'INCOMPLETE',
            stageTwoStatus: applicant.bapStatus?.stageTwoStatus ?? 'INCOMPLETE',
          },
        });
        await tx.applicant.update({
          where: { id: applicantId },
          data: {
            hasStageOneBAPException: true,
            stageOneBAPExceptionReason: bapException.reason,
          },
        });
        await tx.auditLog.create({
          data: {
            applicantId,
            entityType: 'Applicant',
            entityId: applicantId,
            action: 'UPDATE',
            previousValue: serializeAuditFields('Updated applicant BAP exception', {
              hasStageOneBAPException: false,
              stageOneBAPExceptionReason: null,
            }),
            newValue: serializeAuditFields('Updated applicant BAP exception', {
              hasStageOneBAPException: true,
              stageOneBAPExceptionReason: bapException.reason,
            }),
            performedByUserId: performedByUserId ?? null,
          },
        });
      });
    }
  }

  if (requiresInterviewCheck(targetStatus)) {
    const interviews = await prisma.interview.findMany({
      where: { applicantId },
      select: { status: true },
    });

    const gateResult = validateInterviewGate(interviews);
    if (!gateResult.allowed) {
      return { success: false, error: gateResult.reason };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.applicant.update({
      where: { id: applicantId },
      data: { status: targetStatus },
    });

    await tx.auditLog.create({
      data: {
        applicantId,
        entityType: 'Applicant',
        entityId: applicantId,
        action: 'STATUS_CHANGE',
        previousValue: serializeAuditScalar('status', applicant.status),
        newValue: serializeAuditScalar('status', targetStatus),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true };
}

export async function updateApplicantDetailsWorkflow(
  input: UpdateApplicantDetailsInput,
  performedByUserId?: string | null,
): Promise<ApplicantWorkflowResult> {
  const { id, ...data } = input;
  const applicant = await prisma.applicant.findUnique({ where: { id } });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  const nextApplicantData = {
    legalName: data.legalName,
    preferredName: toOptionalString(data.preferredName),
    dateOfBirth: toOptionalDate(data.dateOfBirth),
    email: data.email,
    phone: toOptionalString(data.phone),
    addressLineOne: toOptionalString(data.addressLineOne),
    addressLineTwo: toOptionalString(data.addressLineTwo),
    city: toOptionalString(data.city),
    postcode: toOptionalString(data.postcode),
    country: toOptionalString(data.country),
    dioceseId: toOptionalString(data.dioceseId),
    programmeId: data.programmeId,
    admissionsYearId: data.admissionsYearId,
  };

  const auditEntries = buildAuditFieldChanges(applicant as Record<string, unknown>, nextApplicantData);

  await prisma.$transaction(async (tx) => {
    await tx.applicant.update({
      where: { id },
      data: nextApplicantData,
    });

    await createApplicantFieldAuditLogs(
      tx,
      id,
      auditEntries,
      performedByUserId,
      'Applicant',
      id,
    );
  });

  return { success: true };
}

export async function updateApplicantEcclesialWorkflow(
  input: UpdateApplicantEcclesialInput,
  performedByUserId?: string | null,
): Promise<ApplicantWorkflowResult> {
  const { id, ...data } = input;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    include: { ecclesialProfile: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  const nextEcclesialData = {
    dioceseId: toOptionalString(data.dioceseId),
    directorOfOrdinandsName: toOptionalString(data.directorOfOrdinandsName),
    directorOfOrdinandsEmail: toOptionalString(data.directorOfOrdinandsEmail),
    directorOfOrdinandsPhone: toOptionalString(data.directorOfOrdinandsPhone),
  };

  const currentEcclesialData = applicant.ecclesialProfile ?? {
    dioceseId: null,
    directorOfOrdinandsName: null,
    directorOfOrdinandsEmail: null,
    directorOfOrdinandsPhone: null,
  };

  const auditEntries = buildAuditFieldChanges(
    currentEcclesialData as Record<string, unknown>,
    nextEcclesialData,
  );

  await prisma.$transaction(async (tx) => {
    const profile = await tx.ecclesialProfile.upsert({
      where: { applicantId: id },
      update: nextEcclesialData,
      create: {
        applicantId: id,
        ...nextEcclesialData,
      },
    });

    await createApplicantFieldAuditLogs(
      tx,
      id,
      auditEntries,
      performedByUserId,
      'EcclesialProfile',
      profile.id,
    );
  });

  return { success: true };
}

export async function updateApplicantBapWorkflow(
  input: UpdateApplicantBapInput,
  performedByUserId?: string | null,
): Promise<ApplicantWorkflowResult> {
  const { id, stageOneStatus, stageOneDate, hasStageOneBAPException, stageOneBAPExceptionReason } = input;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    include: { bapStatus: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  const nextBapData = {
    stageOneStatus,
    stageOneDate: toOptionalDate(stageOneDate),
    hasStageOneBAPException: hasStageOneBAPException ?? false,
    stageOneBAPExceptionReason: toOptionalString(stageOneBAPExceptionReason),
  };

  const currentBapData = applicant.bapStatus ?? {
    stageOneStatus: 'INCOMPLETE',
    stageOneDate: null,
    hasStageOneBAPException: false,
    stageOneBAPExceptionReason: null,
  };

  const auditEntries = buildAuditFieldChanges(
    currentBapData as Record<string, unknown>,
    nextBapData,
  );

  await prisma.$transaction(async (tx) => {
    await tx.applicant.update({
      where: { id },
      data: {
        hasStageOneBAPException: nextBapData.hasStageOneBAPException,
        stageOneBAPExceptionReason: nextBapData.stageOneBAPExceptionReason,
      },
    });

    const bapStatus = await tx.bAPStatus.upsert({
      where: { applicantId: id },
      update: nextBapData,
      create: {
        applicantId: id,
        stageTwoStatus: 'INCOMPLETE',
        ...nextBapData,
      },
    });

    await createApplicantFieldAuditLogs(
      tx,
      id,
      auditEntries,
      performedByUserId,
      'BAPStatus',
      bapStatus.id,
    );
  });

  return { success: true };
}

export async function exportApplicantsCsvWorkflow(
  filters: Record<string, string | undefined>,
): Promise<ApplicantWorkflowResult<string>> {
  const where = buildWhereClause(filters);

  const applicants = await prisma.applicant.findMany({
    where,
    include: {
      programme: { select: { courseTitle: true } },
      diocese: { select: { name: true } },
      admissionsYear: { select: { label: true } },
      bapStatus: { select: { stageOneStatus: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'Applicant ID',
    'Legal Name',
    'Preferred Name',
    'Email',
    'Phone',
    'Status',
    'Programme',
    'Diocese',
    'Admissions Year',
    'BAP Stage 1',
    'Created At',
  ];

  const rows = applicants.map((a) => [
    a.applicantId,
    a.legalName,
    a.preferredName ?? '',
    a.email ?? '',
    a.phone ?? '',
    a.status,
    a.programme?.courseTitle ?? '',
    a.diocese?.name ?? '',
    a.admissionsYear?.label ?? '',
    a.bapStatus?.stageOneStatus ?? '',
    a.createdAt.toISOString().split('T')[0],
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n');

  return { success: true, data: csvContent };
}
