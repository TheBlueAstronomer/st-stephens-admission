import { describe, it, expect } from 'vitest';
import { createApplicantSchema } from '@/lib/validations/applicant';

describe('createApplicantSchema', () => {
  const validInput = {
    legalName: 'James Smith',
    email: 'james@example.com',
    programmeId: 'prog-1',
    admissionsYearId: 'year-1',
  };

  it('accepts valid minimal input (enquiry-stage required fields)', () => {
    const result = createApplicantSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts valid full input with all optional fields', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      preferredName: 'Jim',
      dateOfBirth: '1990-01-15',
      phone: '+44 7700 900000',
      addressLineOne: '10 Downing Street',
      addressLineTwo: 'Flat 2',
      city: 'London',
      postcode: 'SW1A 2AA',
      country: 'United Kingdom',
      dioceseId: 'diocese-1',
      directorOfOrdinandsName: 'Rev. John Doe',
      directorOfOrdinandsEmail: 'john@diocese.org',
      directorOfOrdinandsPhone: '+44 1234 567890',
      stageOneStatus: 'INCOMPLETE',
      stageOneDate: '2025-03-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing legalName', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      legalName: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.legalName).toBeDefined();
    }
  });

  it('rejects missing email', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing programmeId', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      programmeId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing admissionsYearId', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      admissionsYearId: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string for optional fields', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      preferredName: '',
      phone: '',
      city: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid BAP stage status', () => {
    const result = createApplicantSchema.safeParse({
      ...validInput,
      stageOneStatus: 'INVALID_STATUS',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid BAP stage status values', () => {
    for (const status of ['COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE']) {
      const result = createApplicantSchema.safeParse({
        ...validInput,
        stageOneStatus: status,
      });
      expect(result.success, `${status} should be valid`).toBe(true);
    }
  });
});
