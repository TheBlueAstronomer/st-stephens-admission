import { z } from 'zod';

// Step 1: Personal Details
export const personalDetailsSchema = z.object({
  applicantId: z.string().optional(),
  legalName: z.string().min(1, 'Legal name is required'),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  addressLineOne: z.string().min(1, 'Address line 1 is required'),
  addressLineTwo: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().min(1, 'Country is required'),
});

// Step 2: BAP Status
export const bapStatusSchema = z.object({
  diocese: z.string().min(1, 'Diocese is required'),
  directorOfOrdinands: z.string().min(1, 'Director of Ordinands is required'),
  ddoEmail: z.string().min(1, 'DDO email is required').email('Please enter a valid email address'),
  bapStageOneStatus: z.string().min(1, 'BAP Stage 1 status is required'),
  bapStageOneDate: z.string().optional(),
});

// Step 3: Academic History
export const academicHistorySchema = z.object({
  programmeInterest: z.string().min(1, 'Programme interest is required'),
  undergraduateDegree: z.string().optional(),
  university: z.string().optional(),
  degreeClassification: z.string().optional(),
  postgraduateDegree: z.string().optional(),
  postgraduateUniversity: z.string().optional(),
});

// Step 4: References
export const referencesSchema = z.object({
  ref1Name: z.string().min(1, 'Reference 1 name is required'),
  ref1Email: z.string().min(1, 'Reference 1 email is required').email('Please enter a valid email'),
  ref1Institution: z.string().min(1, 'Reference 1 institution is required'),
  ref2Name: z.string().min(1, 'Reference 2 name is required'),
  ref2Email: z.string().min(1, 'Reference 2 email is required').email('Please enter a valid email'),
  ref2Institution: z.string().min(1, 'Reference 2 institution is required'),
});

// Step 5: Supporting Information
export const supportingInfoSchema = z.object({
  personalStatement: z.string().min(1, 'Personal statement is required').refine(
    (val) => val.split(/\s+/).filter(Boolean).length >= 200,
    'Personal statement must be at least 200 words',
  ),
});

// Step 6: Consent & Declaration
export const consentSchema = z.object({
  declarationAgreed: z.boolean().refine((val) => val === true, 'You must agree to the declaration'),
  dataConsentAgreed: z.boolean().refine((val) => val === true, 'You must consent to data processing'),
});

// Combined schema for full form validation
export const interviewApplicationFormSchema = personalDetailsSchema
  .merge(bapStatusSchema)
  .merge(academicHistorySchema)
  .merge(referencesSchema)
  .merge(supportingInfoSchema)
  .merge(consentSchema);

export type InterviewApplicationFormData = z.infer<typeof interviewApplicationFormSchema>;

// Step schemas array for per-step validation
export const INTERVIEW_FORM_STEP_SCHEMAS = [
  personalDetailsSchema,
  bapStatusSchema,
  academicHistorySchema,
  referencesSchema,
  supportingInfoSchema,
  consentSchema,
] as const;

export const INTERVIEW_FORM_STEP_LABELS = [
  'Personal Details',
  'BAP Status',
  'Academic History',
  'References',
  'Supporting Information',
  'Consent & Declaration',
] as const;
