import { z } from 'zod';

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(''));
const optionalDateText = () => z.string().optional().or(z.literal(''));
const optionalEmail = () => z.string().email().optional().or(z.literal(''));

/**
 * Zod schema for creating an applicant at the enquiry stage.
 * Required fields: legalName, email, admissionsYearId, programmeId.
 * All other fields are optional at enquiry stage.
 */
export const createApplicantSchema = z.object({
  legalName: z.string().min(1, 'Legal name is required').max(200),
  preferredName: optionalText(200),
  dateOfBirth: optionalDateText(),
  email: z.string().email('A valid email is required'),
  phone: optionalText(50),
  addressLineOne: optionalText(300),
  addressLineTwo: optionalText(300),
  city: optionalText(100),
  postcode: optionalText(20),
  country: optionalText(100),
  dioceseId: z.string().optional().or(z.literal('')),
  programmeId: z.string().min(1, 'Programme is required'),
  admissionsYearId: z.string().min(1, 'Admissions year is required'),
  // Ecclesial info (optional at enquiry)
  directorOfOrdinandsName: optionalText(200),
  directorOfOrdinandsEmail: optionalEmail(),
  directorOfOrdinandsPhone: optionalText(50),
  // BAP info (optional at enquiry)
  stageOneStatus: z.enum(['COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE']).optional(),
  stageOneDate: optionalDateText(),
});

export type CreateApplicantInput = z.infer<typeof createApplicantSchema>;

const applicantIdSchema = z.object({
  id: z.string().min(1, 'Applicant ID is required'),
});

export const updateApplicantDetailsSchema = applicantIdSchema.extend({
  legalName: z.string().min(1, 'Legal name is required').max(200),
  preferredName: optionalText(200),
  dateOfBirth: optionalDateText(),
  email: z.string().email('A valid email is required'),
  phone: optionalText(50),
  addressLineOne: optionalText(300),
  addressLineTwo: optionalText(300),
  city: optionalText(100),
  postcode: optionalText(20),
  country: optionalText(100),
  dioceseId: z.string().optional().or(z.literal('')),
  programmeId: z.string().min(1, 'Programme is required'),
  admissionsYearId: z.string().min(1, 'Admissions year is required'),
});

export const updateApplicantEcclesialSchema = applicantIdSchema.extend({
  dioceseId: z.string().optional().or(z.literal('')),
  directorOfOrdinandsName: optionalText(200),
  directorOfOrdinandsEmail: optionalEmail(),
  directorOfOrdinandsPhone: optionalText(50),
});

export const updateApplicantBapSchema = applicantIdSchema.extend({
  stageOneStatus: z.enum(['COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE']),
  stageOneDate: optionalDateText(),
  hasStageOneBAPException: z.boolean().optional(),
  stageOneBAPExceptionReason: optionalText(500),
}).superRefine((input, ctx) => {
  if (input.hasStageOneBAPException && !input.stageOneBAPExceptionReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stageOneBAPExceptionReason'],
      message: 'An exception reason is required when a BAP exception is recorded.',
    });
  }
});

export type UpdateApplicantDetailsInput = z.infer<typeof updateApplicantDetailsSchema>;
export type UpdateApplicantEcclesialInput = z.infer<typeof updateApplicantEcclesialSchema>;
export type UpdateApplicantBapInput = z.infer<typeof updateApplicantBapSchema>;
