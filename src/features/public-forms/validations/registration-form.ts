import { z } from 'zod';

// Step 1: Confirm Identity
export const confirmIdentitySchema = z.object({
  applicantId: z.string().min(1, 'Applicant ID is required (e.g., SSH-2025-0001)'),
  legalName: z.string().min(1, 'Legal name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
});

// Step 2: Contact & Address
export const contactAddressSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  addressLineOne: z.string().min(1, 'Address line 1 is required'),
  addressLineTwo: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().min(1, 'Country is required'),
});

// Step 3: Accommodation
export const accommodationSchema = z.object({
  accommodationType: z.string().min(1, 'Accommodation preference is required'),
  accommodationDuration: z.string().min(1, 'Duration is required'),
  dietaryRequirements: z.string().optional(),
  mobilityRequirements: z.string().optional(),
  additionalNeeds: z.string().optional(),
});

// Step 4: Emergency Contact
export const emergencyContactSchema = z.object({
  emergencyName: z.string().min(1, 'Emergency contact name is required'),
  emergencyRelation: z.string().min(1, 'Relationship is required'),
  emergencyPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

// Step 5: Consent & Declaration
export const registrationConsentSchema = z.object({
  registrationDeclarationAgreed: z.boolean().refine((val) => val === true, 'You must agree to the declaration'),
  registrationDataConsentAgreed: z.boolean().refine((val) => val === true, 'You must consent to data processing'),
});

// Combined schema for full form validation
export const registrationFormSchema = confirmIdentitySchema
  .merge(contactAddressSchema)
  .merge(accommodationSchema)
  .merge(emergencyContactSchema)
  .merge(registrationConsentSchema);

export type RegistrationFormData = z.infer<typeof registrationFormSchema>;

// Step schemas array for per-step validation
export const REGISTRATION_FORM_STEP_SCHEMAS = [
  confirmIdentitySchema,
  contactAddressSchema,
  accommodationSchema,
  emergencyContactSchema,
  registrationConsentSchema,
] as const;

export const REGISTRATION_FORM_STEP_LABELS = [
  'Confirm Identity',
  'Contact & Address',
  'Accommodation',
  'Emergency Contact',
  'Consent & Declaration',
] as const;
