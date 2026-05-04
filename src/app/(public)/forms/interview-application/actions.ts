'use server';

import { prisma } from '@/lib/db';
import { interviewApplicationFormSchema } from '@/lib/validations/interview-application-form';
import { findMatchingApplicant } from '@/lib/services/duplicate-matching';
import { generateApplicantId } from '@/lib/services/applicant-id';
import { serializeAuditFields } from '@/lib/audit-log';

interface SubmissionResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitInterviewApplication(
  formData: FormData,
): Promise<SubmissionResult> {
  // Extract and validate form data
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      if (value === 'true') raw[key] = true;
      else if (value === 'false') raw[key] = false;
      else raw[key] = value;
    }
  }

  const parsed = interviewApplicationFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.');
      fieldErrors[field] = issue.message;
    }
    return { success: false, error: 'Please fix the validation errors.', fieldErrors };
  }

  const data = parsed.data;

  try {
    // Run duplicate matching (US-06 & US-07)
    const matchResult = await findMatchingApplicant({
      applicantId: data.applicantId || undefined,
      email: data.email,
      legalName: data.legalName,
      dateOfBirth: data.dateOfBirth,
    });

    let applicantId: string;
    let applicantInternalId: string;

    if (matchResult.confidence === 'HIGH' && matchResult.match) {
      // High confidence: update existing record
      applicantInternalId = matchResult.match.id;
      applicantId = matchResult.match.applicantId;

      // Find diocese ID
      const diocese = data.diocese
        ? await prisma.diocese.findFirst({ where: { name: data.diocese } })
        : null;

      // Find programme ID
      const programme = data.programmeInterest
        ? await prisma.academicProgramme.findFirst({
            where: { courseTitle: data.programmeInterest },
          })
        : null;

      await prisma.applicant.update({
        where: { id: applicantInternalId },
        data: {
          legalName: data.legalName,
          preferredName: data.preferredName || null,
          dateOfBirth: new Date(data.dateOfBirth),
          email: data.email,
          phone: data.phone,
          addressLineOne: data.addressLineOne,
          addressLineTwo: data.addressLineTwo || null,
          city: data.city,
          postcode: data.postcode,
          country: data.country,
          status: 'INTERVIEW_APPLICATION_RECEIVED',
          ...(diocese ? { dioceseId: diocese.id } : {}),
          ...(programme ? { programmeId: programme.id } : {}),
        },
      });

      // Update ecclesial profile
      await prisma.ecclesialProfile.upsert({
        where: { applicantId: applicantInternalId },
        update: {
          directorOfOrdinandsName: data.directorOfOrdinands,
          directorOfOrdinandsEmail: data.ddoEmail,
          ...(diocese ? { dioceseId: diocese.id } : {}),
        },
        create: {
          applicantId: applicantInternalId,
          directorOfOrdinandsName: data.directorOfOrdinands,
          directorOfOrdinandsEmail: data.ddoEmail,
          ...(diocese ? { dioceseId: diocese.id } : {}),
        },
      });

      // Update BAP status
      await prisma.bAPStatus.upsert({
        where: { applicantId: applicantInternalId },
        update: {
          stageOneStatus: data.bapStageOneStatus as any,
          stageOneDate: data.bapStageOneDate ? new Date(data.bapStageOneDate) : null,
        },
        create: {
          applicantId: applicantInternalId,
          stageOneStatus: data.bapStageOneStatus as any,
          stageOneDate: data.bapStageOneDate ? new Date(data.bapStageOneDate) : null,
        },
      });
    } else if (matchResult.confidence === 'LOW' && matchResult.match) {
      // Low confidence: flag for staff review, do NOT auto-merge
      await prisma.pendingSubmission.create({
        data: {
          formType: 'INTERVIEW_APPLICATION',
          submittedData: raw as any,
          submittedEmail: data.email,
          submittedName: data.legalName,
          submittedDob: new Date(data.dateOfBirth),
          potentialMatchId: matchResult.match.id,
          needsReview: true,
        },
      });

      // Return a confirmation even for pending — the applicant doesn't need to know
      return {
        success: true,
        redirectUrl: `/forms/interview-application/confirmation?ref=PENDING&name=${encodeURIComponent(data.legalName)}`,
      };
    } else {
      // No match: create new applicant
      applicantId = await generateApplicantId();

      // Find diocese and programme
      const diocese = data.diocese
        ? await prisma.diocese.findFirst({ where: { name: data.diocese } })
        : null;
      const programme = data.programmeInterest
        ? await prisma.academicProgramme.findFirst({
            where: { courseTitle: data.programmeInterest },
          })
        : null;

      const newApplicant = await prisma.applicant.create({
        data: {
          applicantId,
          legalName: data.legalName,
          preferredName: data.preferredName || null,
          dateOfBirth: new Date(data.dateOfBirth),
          email: data.email,
          phone: data.phone,
          addressLineOne: data.addressLineOne,
          addressLineTwo: data.addressLineTwo || null,
          city: data.city,
          postcode: data.postcode,
          country: data.country,
          status: 'INTERVIEW_APPLICATION_RECEIVED',
          ...(diocese ? { dioceseId: diocese.id } : {}),
          ...(programme ? { programmeId: programme.id } : {}),
        },
      });

      applicantInternalId = newApplicant.id;

      // Create ecclesial profile
      await prisma.ecclesialProfile.create({
        data: {
          applicantId: applicantInternalId,
          directorOfOrdinandsName: data.directorOfOrdinands,
          directorOfOrdinandsEmail: data.ddoEmail,
          ...(diocese ? { dioceseId: diocese.id } : {}),
        },
      });

      // Create BAP status
      await prisma.bAPStatus.create({
        data: {
          applicantId: applicantInternalId,
          stageOneStatus: data.bapStageOneStatus as any,
          stageOneDate: data.bapStageOneDate ? new Date(data.bapStageOneDate) : null,
        },
      });
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        applicantId: applicantInternalId,
        entityType: 'Applicant',
        entityId: applicantInternalId,
        action: 'INTERVIEW_APPLICATION_SUBMITTED',
        newValue: serializeAuditFields(
          'Interview application submitted via public form',
          {
            email: data.email,
            legalName: data.legalName,
            matchConfidence: matchResult.confidence,
          },
        ),
      },
    });

    return {
      success: true,
      redirectUrl: `/forms/interview-application/confirmation?ref=${encodeURIComponent(applicantId)}&name=${encodeURIComponent(data.preferredName || data.legalName)}`,
    };
  } catch (error) {
    console.error('Interview application submission error:', error);
    return { success: false, error: 'An error occurred processing your application. Please try again.' };
  }
}
