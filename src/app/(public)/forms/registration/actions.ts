'use server';

import { prisma } from '@/lib/db';
import { registrationFormSchema } from '@/lib/validations/registration-form';
import { findMatchingApplicant } from '@/lib/services/duplicate-matching';
import { serializeAuditFields } from '@/lib/audit-log';

interface SubmissionResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitRegistration(formData: FormData): Promise<SubmissionResult> {
  // Extract and validate form data
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      if (value === 'true') raw[key] = true;
      else if (value === 'false') raw[key] = false;
      else raw[key] = value;
    }
  }

  const parsed = registrationFormSchema.safeParse(raw);
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
    // Find the applicant — registration requires an existing record
    const matchResult = await findMatchingApplicant({
      applicantId: data.applicantId,
      email: data.email,
      legalName: data.legalName,
      dateOfBirth: data.dateOfBirth,
    });

    if (matchResult.confidence === 'NONE' || !matchResult.match) {
      return {
        success: false,
        error:
          'We could not find your applicant record. Please check your Applicant ID and try again, or contact admissions@ssho.ox.ac.uk for assistance.',
      };
    }

    if (matchResult.confidence === 'LOW') {
      // Low confidence: flag for staff review
      await prisma.pendingSubmission.create({
        data: {
          formType: 'REGISTRATION',
          submittedData: raw as any,
          submittedEmail: data.email,
          submittedName: data.legalName,
          submittedDob: new Date(data.dateOfBirth),
          potentialMatchId: matchResult.match.id,
          needsReview: true,
        },
      });

      return {
        success: true,
        redirectUrl: `/forms/registration/confirmation?ref=PENDING&name=${encodeURIComponent(data.legalName)}`,
      };
    }

    // High confidence: update applicant record
    const applicant = matchResult.match;

    // Update applicant contact details
    await prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        phone: data.phone,
        addressLineOne: data.addressLineOne,
        addressLineTwo: data.addressLineTwo || null,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        status: 'REGISTRATION_FORM_RECEIVED',
        registrationFormReceivedAt: new Date(),
      },
    });

    // Upsert registration record
    await prisma.registration.upsert({
      where: { applicantId: applicant.id },
      update: {
        registrationFormReceivedAt: new Date(),
      },
      create: {
        applicantId: applicant.id,
        registrationFormReceivedAt: new Date(),
      },
    });

    // Upsert accommodation request
    const accommodationNotes = [
      data.dietaryRequirements ? `Dietary: ${data.dietaryRequirements}` : '',
      data.mobilityRequirements ? `Mobility: ${data.mobilityRequirements}` : '',
      data.additionalNeeds ? `Additional: ${data.additionalNeeds}` : '',
    ]
      .filter(Boolean)
      .join('\n') || null;

    // Map form accommodation type to DB enum (SINGLE/FAMILY)
    const isAccommodationRequired = data.accommodationType !== 'NON_RESIDENTIAL';
    const dbAccommodationType = data.accommodationType === 'RESIDENTIAL' ? 'SINGLE' : null;
    const dbDuration = data.accommodationDuration === 'FULL_YEAR' ? 'FULL_YEAR'
      : data.accommodationDuration === 'TERM_TIME' ? 'TERM_TIME'
      : null;

    await prisma.accommodationRequest.upsert({
      where: { applicantId: applicant.id },
      update: {
        isAccommodationRequired,
        accommodationType: dbAccommodationType as any,
        duration: dbDuration as any,
        notes: accommodationNotes,
      },
      create: {
        applicantId: applicant.id,
        isAccommodationRequired,
        accommodationType: dbAccommodationType as any,
        duration: dbDuration as any,
        notes: accommodationNotes,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        applicantId: applicant.id,
        entityType: 'Applicant',
        entityId: applicant.id,
        action: 'REGISTRATION_SUBMITTED',
        newValue: serializeAuditFields(
          'Registration form submitted via public form',
          {
            email: data.email,
            legalName: data.legalName,
            accommodationType: data.accommodationType,
          },
        ),
      },
    });

    return {
      success: true,
      redirectUrl: `/forms/registration/confirmation?ref=${encodeURIComponent(applicant.applicantId)}&name=${encodeURIComponent(data.legalName)}`,
    };
  } catch (error) {
    console.error('Registration submission error:', error);
    return {
      success: false,
      error: 'An error occurred processing your registration. Please try again.',
    };
  }
}
