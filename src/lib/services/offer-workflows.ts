import { prisma } from '@/lib/db';
import { serializeAuditScalar, serializeAuditFields } from '@/lib/audit-log';
import { validateInterviewGate } from '@/lib/business-rules/interview-gate';
import { validateOfferGate } from '@/lib/business-rules/offer-gate';
import { validateDocumentGate } from '@/lib/business-rules/document-gate';
import type { CreateOfferInput, AcceptOfferInput } from '@/lib/validations/offer';
import type { ApplicantStatus } from '@/generated/prisma/client';

export interface OfferWorkflowResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const OFFER_TYPE_TO_STATUS: Record<string, ApplicantStatus> = {
  CONDITIONAL: 'CONDITIONAL_OFFER',
  UNCONDITIONAL: 'UNCONDITIONAL_OFFER',
  DECLINED: 'DECLINED',
  WITHDRAWN: 'WITHDRAWN',
};

export async function createOfferWorkflow(
  input: CreateOfferInput,
  performedByUserId?: string | null,
): Promise<OfferWorkflowResult<{ offerId: string }>> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: input.applicantId },
    include: { interviews: { select: { status: true } } },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  const gateResult = validateInterviewGate(applicant.interviews);
  if (!gateResult.allowed) {
    return { success: false, error: gateResult.reason };
  }

  const targetStatus = OFFER_TYPE_TO_STATUS[input.offerType] as ApplicantStatus;

  const notes = input.decisionNotes?.trim() || null;

  const result = await prisma.$transaction(async (tx) => {
    const offer = await tx.offer.upsert({
      where: { applicantId: input.applicantId },
      update: {
        offerType: input.offerType,
        decisionDate: new Date(input.decisionDate),
        conditions: input.conditions,
        decisionNotes: notes,
        acceptedAt: null,
        declinedAt: input.offerType === 'DECLINED' ? new Date() : null,
        withdrawnAt: input.offerType === 'WITHDRAWN' ? new Date() : null,
      },
      create: {
        applicantId: input.applicantId,
        offerType: input.offerType,
        decisionDate: new Date(input.decisionDate),
        conditions: input.conditions,
        decisionNotes: notes,
        declinedAt: input.offerType === 'DECLINED' ? new Date() : null,
        withdrawnAt: input.offerType === 'WITHDRAWN' ? new Date() : null,
      },
    });

    await tx.applicant.update({
      where: { id: input.applicantId },
      data: { status: targetStatus },
    });

    await tx.auditLog.create({
      data: {
        applicantId: input.applicantId,
        entityType: 'Offer',
        entityId: offer.id,
        action: 'OFFER_CREATED',
        newValue: serializeAuditFields('Offer decision recorded', {
          offerType: input.offerType,
          status: targetStatus,
          decisionDate: input.decisionDate,
        }),
        performedByUserId: performedByUserId ?? null,
      },
    });

    return offer;
  });

  return { success: true, data: { offerId: result.id } };
}

export async function acceptOfferWorkflow(
  input: AcceptOfferInput,
  performedByUserId?: string | null,
): Promise<OfferWorkflowResult> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: input.applicantId },
    include: { offer: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  if (!applicant.offer) {
    return { success: false, error: 'No offer found for this applicant.' };
  }

  if (applicant.offer.offerType === 'DECLINED' || applicant.offer.offerType === 'WITHDRAWN') {
    return { success: false, error: 'Cannot accept a declined or withdrawn offer.' };
  }

  const acceptedAt = input.acceptedAt ? new Date(input.acceptedAt) : new Date();

  await prisma.$transaction(async (tx) => {
    await tx.offer.update({
      where: { applicantId: input.applicantId },
      data: { acceptedAt },
    });

    await tx.auditLog.create({
      data: {
        applicantId: input.applicantId,
        entityType: 'Offer',
        entityId: applicant.offer!.id,
        action: 'OFFER_ACCEPTED',
        newValue: serializeAuditScalar('acceptedAt', acceptedAt.toISOString()),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true };
}

export async function markRegistrationReceivedWorkflow(
  applicantId: string,
  performedByUserId?: string | null,
): Promise<OfferWorkflowResult> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { offer: true },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  const gateResult = validateOfferGate(applicant.offer);
  if (!gateResult.allowed) {
    return { success: false, error: gateResult.reason };
  }

  const receivedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.applicant.update({
      where: { id: applicantId },
      data: {
        registrationFormReceivedAt: receivedAt,
        status: 'REGISTRATION_FORM_RECEIVED',
      },
    });

    await tx.registration.upsert({
      where: { applicantId },
      update: { registrationFormReceivedAt: receivedAt, receivedAt },
      create: {
        applicantId,
        registrationFormReceivedAt: receivedAt,
        receivedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        applicantId,
        entityType: 'Applicant',
        entityId: applicantId,
        action: 'REGISTRATION_RECEIVED',
        newValue: serializeAuditScalar('registrationFormReceivedAt', receivedAt.toISOString()),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true };
}

export async function confirmOrdinandWorkflow(
  applicantId: string,
  performedByUserId?: string | null,
): Promise<OfferWorkflowResult> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: {
      offer: true,
      documents: {
        include: { documentType: { select: { name: true } } },
      },
    },
  });

  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  if (!applicant.registrationFormReceivedAt) {
    return {
      success: false,
      error: 'Registration form must be received before confirming as ordinand.',
    };
  }

  const docGate = validateDocumentGate(applicant.documents);
  if (!docGate.allowed) {
    const list = docGate.missingDocuments.join(', ');
    return {
      success: false,
      error: `Cannot confirm: mandatory documents outstanding — ${list}.`,
    };
  }

  const confirmedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.applicant.update({
      where: { id: applicantId },
      data: {
        status: 'CONFIRMED_ORDINAND',
        confirmedOrdinandAt: confirmedAt,
      },
    });

    await tx.registration.upsert({
      where: { applicantId },
      update: { confirmedOrdinandAt: confirmedAt },
      create: {
        applicantId,
        confirmedOrdinandAt: confirmedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        applicantId,
        entityType: 'Applicant',
        entityId: applicantId,
        action: 'CONFIRMED_ORDINAND',
        newValue: serializeAuditScalar('confirmedOrdinandAt', confirmedAt.toISOString()),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true };
}
