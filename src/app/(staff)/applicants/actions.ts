'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/require-role';
import { createApplicantSchema, type CreateApplicantInput } from '@/lib/validations/applicant';
import { generateApplicantId } from '@/lib/services/applicant-id';
import { validateBAPGate } from '@/lib/business-rules/bap-gate';
import {
  isValidTransition,
  requiresBAPCheck,
  requiresInterviewCheck,
} from '@/lib/business-rules/status-transitions';
import { validateInterviewGate } from '@/lib/business-rules/interview-gate';
import { buildWhereClause } from '@/lib/queries/applicant-filters';
import type { ApplicantStatus, BAPStageStatus } from '@/generated/prisma/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

// ─── Create Applicant ───────────────────────────────────────────────────────

export async function createApplicant(
  input: CreateApplicantInput,
): Promise<ActionResult<{ id: string; applicantId: string }>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  // Validate input
  const parsed = createApplicantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors
        ? Object.values(parsed.error.flatten().fieldErrors).flat().join('; ')
        : 'Validation failed.',
    };
  }

  const data = parsed.data;
  let warning: string | undefined;

  // Duplicate email detection (soft warning, not hard block per PRD)
  if (data.email) {
    const existing = await prisma.applicant.findFirst({
      where: { email: data.email },
      select: { applicantId: true, legalName: true },
    });
    if (existing) {
      warning = `An applicant with email "${data.email}" already exists (${existing.legalName}, ${existing.applicantId}). The record will still be created.`;
    }
  }

  // Extract year from admissions year for ID generation
  const admissionsYear = await prisma.admissionsYear.findUnique({
    where: { id: data.admissionsYearId },
    select: { label: true },
  });
  const yearStr = admissionsYear?.label?.match(/\d{4}/)?.[0];
  const applicantId = await generateApplicantId(yearStr);

  // Create applicant + audit log in a transaction
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

    // Create ecclesial profile if DDO info provided
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

    // Create BAP status if provided
    if (data.stageOneStatus) {
      await tx.bAPStatus.create({
        data: {
          applicantId: newApplicant.id,
          stageOneStatus: data.stageOneStatus as BAPStageStatus,
          stageOneDate: data.stageOneDate ? new Date(data.stageOneDate) : null,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        entityType: 'Applicant',
        entityId: newApplicant.id,
        action: 'CREATE',
        newValue: JSON.stringify({
          applicantId,
          legalName: data.legalName,
          email: data.email,
          status: 'ENQUIRY',
        }),
        performedByUserId: session?.user?.id ?? null,
      },
    });

    return newApplicant;
  });

  revalidatePath('/applicants');

  return {
    success: true,
    data: { id: applicant.id, applicantId: applicant.applicantId },
    warning,
  };
}

// ─── Update Applicant Status ────────────────────────────────────────────────

export async function updateApplicantStatus(
  applicantId: string,
  targetStatus: ApplicantStatus,
  bapException?: { hasException: boolean; reason?: string },
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  // Fetch applicant with BAP status
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { bapStatus: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  // Check valid transition
  const transitionResult = isValidTransition(applicant.status, targetStatus);
  if (!transitionResult.allowed) {
    return { success: false, error: transitionResult.reason };
  }

  // BAP gate check for statuses beyond ENQUIRY
  if (requiresBAPCheck(targetStatus)) {
    const bapStatus = applicant.bapStatus;
    const stageOneStatus = bapStatus?.stageOneStatus ?? 'INCOMPLETE';
    const hasException = bapException?.hasException ?? applicant.hasStageOneBAPException;
    const exceptionReason =
      bapException?.reason ?? applicant.stageOneBAPExceptionReason;

    const gateResult = validateBAPGate({
      stageOneStatus,
      hasException,
      exceptionReason,
    });

    if (!gateResult.allowed) {
      return { success: false, error: gateResult.reason };
    }

    // If exception is being newly recorded, update the applicant and log it
    if (bapException?.hasException && bapException?.reason) {
      await prisma.$transaction(async (tx) => {
        await tx.applicant.update({
          where: { id: applicantId },
          data: {
            hasStageOneBAPException: true,
            stageOneBAPExceptionReason: bapException.reason,
          },
        });
        await tx.auditLog.create({
          data: {
            entityType: 'Applicant',
            entityId: applicantId,
            action: 'UPDATE',
            previousValue: JSON.stringify({ hasStageOneBAPException: false }),
            newValue: JSON.stringify({
              hasStageOneBAPException: true,
              reason: bapException.reason,
            }),
            performedByUserId: session?.user?.id ?? null,
          },
        });
      });
    }
  }

  // Interview gate check for offer statuses (US-10)
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

  // Perform status update with audit log
  await prisma.$transaction(async (tx) => {
    await tx.applicant.update({
      where: { id: applicantId },
      data: { status: targetStatus },
    });

    await tx.auditLog.create({
      data: {
        entityType: 'Applicant',
        entityId: applicantId,
        action: 'STATUS_CHANGE',
        previousValue: applicant.status,
        newValue: targetStatus,
        performedByUserId: session?.user?.id ?? null,
      },
    });
  });

  revalidatePath(`/applicants/${applicantId}`);
  revalidatePath('/applicants');

  return { success: true };
}

// ─── Update Applicant Fields ────────────────────────────────────────────────

export async function updateApplicant(
  id: string,
  updates: Record<string, unknown>,
): Promise<ActionResult> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');
  const session = await auth();

  const applicant = await prisma.applicant.findUnique({
    where: { id },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  // Build audit log entries for changed fields
  const auditEntries: { field: string; previousValue: string; newValue: string }[] = [];

  for (const [key, newVal] of Object.entries(updates)) {
    const oldVal = (applicant as Record<string, unknown>)[key];
    if (oldVal !== newVal) {
      auditEntries.push({
        field: key,
        previousValue: String(oldVal ?? ''),
        newValue: String(newVal ?? ''),
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.applicant.update({
      where: { id },
      data: updates as Parameters<typeof tx.applicant.update>[0]['data'],
    });

    for (const entry of auditEntries) {
      await tx.auditLog.create({
        data: {
          entityType: 'Applicant',
          entityId: id,
          action: 'UPDATE',
          previousValue: `${entry.field}: ${entry.previousValue}`,
          newValue: `${entry.field}: ${entry.newValue}`,
          performedByUserId: session?.user?.id ?? null,
        },
      });
    }
  });

  revalidatePath(`/applicants/${id}`);
  revalidatePath('/applicants');

  return { success: true };
}

// ─── Export Applicants as CSV ───────────────────────────────────────────────

export async function exportApplicantsCSV(
  filters: Record<string, string | undefined>,
): Promise<ActionResult<string>> {
  await requireRole('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR');

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

  // Build CSV
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

