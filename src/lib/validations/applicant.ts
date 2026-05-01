import { z } from 'zod';

/**
 * Zod schema for creating an applicant at the enquiry stage.
 * Required fields: legalName, email, admissionsYearId, programmeId.
 * All other fields are optional at enquiry stage.
 */
export const createApplicantSchema = z.object({
  legalName: z.string().min(1, 'Legal name is required').max(200),
  preferredName: z.string().max(200).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  email: z.string().email('A valid email is required'),
  phone: z.string().max(50).optional().or(z.literal('')),
  addressLineOne: z.string().max(300).optional().or(z.literal('')),
  addressLineTwo: z.string().max(300).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  postcode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  dioceseId: z.string().optional().or(z.literal('')),
  programmeId: z.string().min(1, 'Programme is required'),
  admissionsYearId: z.string().min(1, 'Admissions year is required'),
  // Ecclesial info (optional at enquiry)
  directorOfOrdinandsName: z.string().max(200).optional().or(z.literal('')),
  directorOfOrdinandsEmail: z.string().email().optional().or(z.literal('')),
  directorOfOrdinandsPhone: z.string().max(50).optional().or(z.literal('')),
  // BAP info (optional at enquiry)
  stageOneStatus: z.enum(['COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE']).optional(),
  stageOneDate: z.string().optional().or(z.literal('')),
});

export type CreateApplicantInput = z.infer<typeof createApplicantSchema>;

/**
 * Zod schema for updating applicant fields (partial).
 */
export const updateApplicantSchema = createApplicantSchema.partial().extend({
  id: z.string().min(1, 'Applicant ID is required'),
});

export type UpdateApplicantInput = z.infer<typeof updateApplicantSchema>;
