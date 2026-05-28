import { describe, it, expect } from 'vitest';
import {
  personalDetailsSchema,
  bapStatusSchema,
  academicHistorySchema,
  referencesSchema,
  supportingInfoSchema,
  consentSchema,
  interviewApplicationFormSchema,
  INTERVIEW_FORM_STEP_LABELS,
  INTERVIEW_FORM_STEP_SCHEMAS,
} from '@/features/public-forms/validations/interview-application-form';
import {
  confirmIdentitySchema,
  contactAddressSchema,
  accommodationSchema,
  emergencyContactSchema,
  registrationConsentSchema,
  registrationFormSchema,
  REGISTRATION_FORM_STEP_LABELS,
  REGISTRATION_FORM_STEP_SCHEMAS,
} from '@/features/public-forms/validations/registration-form';

// ─── Interview Application Form Validation ─────────────────────────

describe('Interview Application Form — Step Schemas', () => {
  describe('Step 1: Personal Details', () => {
    it('rejects empty fields', () => {
      const result = personalDetailsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid personal details', () => {
      const result = personalDetailsSchema.safeParse({
        legalName: 'John Smith',
        preferredName: 'Johnny',
        dateOfBirth: '1990-01-15',
        email: 'john@example.com',
        phone: '+44 7700 900000',
        addressLineOne: '123 Test St',
        addressLineTwo: '',
        city: 'Oxford',
        postcode: 'OX1 1AA',
        country: 'United Kingdom',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = personalDetailsSchema.safeParse({
        legalName: 'John Smith',
        dateOfBirth: '1990-01-15',
        email: 'not-an-email',
        phone: '+44 7700 900000',
        addressLineOne: '123 Test St',
        city: 'Oxford',
        postcode: 'OX1 1AA',
        country: 'United Kingdom',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
      }
    });

    it('allows optional preferredName and addressLineTwo', () => {
      const result = personalDetailsSchema.safeParse({
        legalName: 'John Smith',
        dateOfBirth: '1990-01-15',
        email: 'john@example.com',
        phone: '+44 7700 900000',
        addressLineOne: '123 Test St',
        city: 'Oxford',
        postcode: 'OX1 1AA',
        country: 'United Kingdom',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 2: BAP Status', () => {
    it('rejects empty required fields', () => {
      const result = bapStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid BAP status', () => {
      const result = bapStatusSchema.safeParse({
        diocese: 'Oxford',
        directorOfOrdinands: 'Rev. Smith',
        ddoEmail: 'ddo@diocese.org',
        bapStageOneStatus: 'PASSED',
        bapStageOneDate: '2024-06-15',
      });
      expect(result.success).toBe(true);
    });

    it('allows optional bapStageOneDate', () => {
      const result = bapStatusSchema.safeParse({
        diocese: 'Oxford',
        directorOfOrdinands: 'Rev. Smith',
        ddoEmail: 'ddo@diocese.org',
        bapStageOneStatus: 'NOT_STARTED',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 3: Academic History', () => {
    it('rejects empty programmeInterest', () => {
      const result = academicHistorySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid academic history', () => {
      const result = academicHistorySchema.safeParse({
        programmeInterest: 'BA in Theology',
        undergraduateDegree: 'BA English',
        university: 'University of Cambridge',
        degreeClassification: 'FIRST',
        postgraduateDegree: 'MA Theology',
        postgraduateUniversity: 'University of Oxford',
      });
      expect(result.success).toBe(true);
    });

    it('allows optional academic fields', () => {
      const result = academicHistorySchema.safeParse({
        programmeInterest: 'BA in Theology',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 4: References', () => {
    it('rejects empty fields', () => {
      const result = referencesSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid references', () => {
      const result = referencesSchema.safeParse({
        ref1Name: 'Dr. Smith',
        ref1Email: 'smith@university.ac.uk',
        ref1Institution: 'University of Oxford',
        ref2Name: 'Rev. Jones',
        ref2Email: 'jones@diocese.org',
        ref2Institution: 'Diocese of Oxford',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = referencesSchema.safeParse({
        ref1Name: 'Dr. Smith',
        ref1Email: 'not-an-email',
        ref1Institution: 'University of Oxford',
        ref2Name: 'Rev. Jones',
        ref2Email: 'jones@diocese.org',
        ref2Institution: 'Diocese of Oxford',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step 5: Supporting Information', () => {
    it('rejects empty personalStatement', () => {
      const result = supportingInfoSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects personal statement under 200 words', () => {
      const result = supportingInfoSchema.safeParse({
        personalStatement: 'This is too short.',
      });
      expect(result.success).toBe(false);
    });

    it('accepts personal statement with 200+ words', () => {
      const words = Array(201).fill('word').join(' ');
      const result = supportingInfoSchema.safeParse({
        personalStatement: words,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 6: Consent', () => {
    it('rejects when declaration is not agreed', () => {
      const result = consentSchema.safeParse({
        declarationAgreed: false,
        dataConsentAgreed: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects when data consent is not agreed', () => {
      const result = consentSchema.safeParse({
        declarationAgreed: true,
        dataConsentAgreed: false,
      });
      expect(result.success).toBe(false);
    });

    it('accepts when both are agreed', () => {
      const result = consentSchema.safeParse({
        declarationAgreed: true,
        dataConsentAgreed: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Combined Schema', () => {
    const validData = {
      legalName: 'John Smith',
      dateOfBirth: '1990-01-15',
      email: 'john@example.com',
      phone: '+44 7700 900000',
      addressLineOne: '123 Test St',
      city: 'Oxford',
      postcode: 'OX1 1AA',
      country: 'United Kingdom',
      diocese: 'Oxford',
      directorOfOrdinands: 'Rev. Smith',
      ddoEmail: 'ddo@diocese.org',
      bapStageOneStatus: 'PASSED',
      programmeInterest: 'BA in Theology',
      ref1Name: 'Dr. Smith',
      ref1Email: 'smith@uni.ac.uk',
      ref1Institution: 'University of Oxford',
      ref2Name: 'Rev. Jones',
      ref2Email: 'jones@dio.org',
      ref2Institution: 'Diocese of Oxford',
      personalStatement: Array(201).fill('word').join(' '),
      declarationAgreed: true,
      dataConsentAgreed: true,
    };

    it('accepts fully valid form data', () => {
      const result = interviewApplicationFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects incomplete data', () => {
      const result = interviewApplicationFormSchema.safeParse({
        legalName: 'John Smith',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step metadata', () => {
    it('has 6 step labels', () => {
      expect(INTERVIEW_FORM_STEP_LABELS).toHaveLength(6);
    });

    it('has 6 step schemas', () => {
      expect(INTERVIEW_FORM_STEP_SCHEMAS).toHaveLength(6);
    });

    it('step labels match expected names', () => {
      expect(INTERVIEW_FORM_STEP_LABELS[0]).toBe('Personal Details');
      expect(INTERVIEW_FORM_STEP_LABELS[5]).toBe('Consent & Declaration');
    });
  });
});

// ─── Registration Form Validation ──────────────────────────────────

describe('Registration Form — Step Schemas', () => {
  describe('Step 1: Confirm Identity', () => {
    it('rejects empty fields', () => {
      const result = confirmIdentitySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid identity data', () => {
      const result = confirmIdentitySchema.safeParse({
        applicantId: 'SSH-2025-0001',
        legalName: 'Jane Doe',
        email: 'jane@example.com',
        dateOfBirth: '1992-03-20',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = confirmIdentitySchema.safeParse({
        applicantId: 'SSH-2025-0001',
        legalName: 'Jane Doe',
        email: 'not-valid',
        dateOfBirth: '1992-03-20',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step 2: Contact & Address', () => {
    it('rejects empty fields', () => {
      const result = contactAddressSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid contact data', () => {
      const result = contactAddressSchema.safeParse({
        phone: '+44 7700 900001',
        addressLineOne: '456 Elm Ave',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 3: Accommodation', () => {
    it('rejects empty required fields', () => {
      const result = accommodationSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid accommodation data', () => {
      const result = accommodationSchema.safeParse({
        accommodationType: 'RESIDENTIAL',
        accommodationDuration: 'TERM_TIME',
        dietaryRequirements: 'Vegetarian',
        mobilityRequirements: 'None',
        additionalNeeds: '',
      });
      expect(result.success).toBe(true);
    });

    it('allows optional fields', () => {
      const result = accommodationSchema.safeParse({
        accommodationType: 'NON_RESIDENTIAL',
        accommodationDuration: 'NOT_APPLICABLE',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 4: Emergency Contact', () => {
    it('rejects empty required fields', () => {
      const result = emergencyContactSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid emergency contact', () => {
      const result = emergencyContactSchema.safeParse({
        emergencyName: 'Bob Doe',
        emergencyRelation: 'Spouse',
        emergencyPhone: '+44 7700 900002',
        emergencyEmail: 'bob@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('allows empty emergency email', () => {
      const result = emergencyContactSchema.safeParse({
        emergencyName: 'Bob Doe',
        emergencyRelation: 'Parent',
        emergencyPhone: '+44 7700 900002',
        emergencyEmail: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 5: Consent', () => {
    it('rejects when declaration is not agreed', () => {
      const result = registrationConsentSchema.safeParse({
        registrationDeclarationAgreed: false,
        registrationDataConsentAgreed: true,
      });
      expect(result.success).toBe(false);
    });

    it('accepts when both are agreed', () => {
      const result = registrationConsentSchema.safeParse({
        registrationDeclarationAgreed: true,
        registrationDataConsentAgreed: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Combined Schema', () => {
    const validData = {
      applicantId: 'SSH-2025-0001',
      legalName: 'Jane Doe',
      email: 'jane@example.com',
      dateOfBirth: '1992-03-20',
      phone: '+44 7700 900001',
      addressLineOne: '456 Elm Ave',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
      accommodationType: 'RESIDENTIAL',
      accommodationDuration: 'TERM_TIME',
      emergencyName: 'Bob Doe',
      emergencyRelation: 'Spouse',
      emergencyPhone: '+44 7700 900002',
      registrationDeclarationAgreed: true,
      registrationDataConsentAgreed: true,
    };

    it('accepts fully valid form data', () => {
      const result = registrationFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects incomplete data', () => {
      const result = registrationFormSchema.safeParse({
        applicantId: 'SSH-2025-0001',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step metadata', () => {
    it('has 5 step labels', () => {
      expect(REGISTRATION_FORM_STEP_LABELS).toHaveLength(5);
    });

    it('has 5 step schemas', () => {
      expect(REGISTRATION_FORM_STEP_SCHEMAS).toHaveLength(5);
    });

    it('step labels match expected names', () => {
      expect(REGISTRATION_FORM_STEP_LABELS[0]).toBe('Confirm Identity');
      expect(REGISTRATION_FORM_STEP_LABELS[4]).toBe('Consent & Declaration');
    });
  });
});

// ─── Duplicate Matching (structural validation) ────────────────────

describe('Duplicate Matching — Types', () => {
  it('exports MatchConfidence type', async () => {
    const mod = await import('@/features/applicants/services/duplicate-matching');
    expect(mod.findMatchingApplicant).toBeDefined();
    expect(typeof mod.findMatchingApplicant).toBe('function');
  });
});
