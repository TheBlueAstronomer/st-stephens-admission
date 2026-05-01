import { describe, it, expect } from 'vitest';
import {
  UserRole,
  ApplicantStatus,
  BAPStageStatus,
  InterviewType,
  InterviewStatus,
  InterviewOutcome,
  OfferType,
  AccommodationType,
  AccommodationDuration,
  DocumentStatus,
  AwardingFramework,
  ModeOfStudy,
  AuditAction,
} from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';

// ─── US-01: Prisma Schema — Core Entities ───────────────────────────────────
// Tests validate that the schema defines all PRD §6 enums and models with
// correct values and field shapes. The public interface is the Prisma Client
// generated from the schema.

describe('US-01: Prisma Schema Enums', () => {
  it('UserRole has all 4 staff roles', () => {
    expect(Object.values(UserRole)).toEqual(
      expect.arrayContaining([
        'ADMISSIONS_STAFF',
        'ACADEMIC_STAFF',
        'SENIOR_LEADERSHIP',
        'SYSTEM_ADMINISTRATOR',
      ]),
    );
    expect(Object.values(UserRole)).toHaveLength(4);
  });

  it('ApplicantStatus has all 12 workflow statuses', () => {
    const expected = [
      'ENQUIRY',
      'VISIT_INVITED',
      'INTERVIEW_APPLICATION_RECEIVED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_COMPLETED',
      'CONDITIONAL_OFFER',
      'UNCONDITIONAL_OFFER',
      'DECLINED',
      'WITHDRAWN',
      'REGISTRATION_FORM_RECEIVED',
      'DOCUMENTS_COMPLETE',
      'CONFIRMED_ORDINAND',
    ];
    expect(Object.values(ApplicantStatus)).toEqual(expect.arrayContaining(expected));
    expect(Object.values(ApplicantStatus)).toHaveLength(12);
  });

  it('BAPStageStatus has 4 values', () => {
    expect(Object.values(BAPStageStatus)).toEqual(
      expect.arrayContaining(['COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE']),
    );
    expect(Object.values(BAPStageStatus)).toHaveLength(4);
  });

  it('InterviewType has 2 values', () => {
    expect(Object.values(InterviewType)).toEqual(
      expect.arrayContaining(['EXPLORATORY_VISIT', 'VISIT_INTERVIEW']),
    );
    expect(Object.values(InterviewType)).toHaveLength(2);
  });

  it('InterviewStatus has 5 values', () => {
    expect(Object.values(InterviewStatus)).toEqual(
      expect.arrayContaining(['REQUIRED', 'NOT_REQUIRED', 'SCHEDULED', 'COMPLETED', 'CANCELLED']),
    );
    expect(Object.values(InterviewStatus)).toHaveLength(5);
  });

  it('InterviewOutcome has 4 values', () => {
    expect(Object.values(InterviewOutcome)).toEqual(
      expect.arrayContaining(['RECOMMENDED', 'NOT_RECOMMENDED', 'DEFERRED', 'WITHDRAWN']),
    );
    expect(Object.values(InterviewOutcome)).toHaveLength(4);
  });

  it('OfferType has 4 values', () => {
    expect(Object.values(OfferType)).toEqual(
      expect.arrayContaining(['CONDITIONAL', 'UNCONDITIONAL', 'DECLINED', 'WITHDRAWN']),
    );
    expect(Object.values(OfferType)).toHaveLength(4);
  });

  it('AccommodationType has 2 values', () => {
    expect(Object.values(AccommodationType)).toEqual(
      expect.arrayContaining(['SINGLE', 'FAMILY']),
    );
    expect(Object.values(AccommodationType)).toHaveLength(2);
  });

  it('AccommodationDuration has 2 values', () => {
    expect(Object.values(AccommodationDuration)).toEqual(
      expect.arrayContaining(['TERM_TIME', 'FULL_YEAR']),
    );
    expect(Object.values(AccommodationDuration)).toHaveLength(2);
  });

  it('DocumentStatus has 4 values', () => {
    expect(Object.values(DocumentStatus)).toEqual(
      expect.arrayContaining(['REQUIRED', 'RECEIVED', 'OUTSTANDING', 'WAIVED']),
    );
    expect(Object.values(DocumentStatus)).toHaveLength(4);
  });

  it('AwardingFramework has 2 values', () => {
    expect(Object.values(AwardingFramework)).toEqual(
      expect.arrayContaining(['COMMON_AWARDS', 'OXFORD']),
    );
    expect(Object.values(AwardingFramework)).toHaveLength(2);
  });

  it('ModeOfStudy has 3 values', () => {
    expect(Object.values(ModeOfStudy)).toEqual(
      expect.arrayContaining(['FULL_TIME', 'PART_TIME', 'OTHER']),
    );
    expect(Object.values(ModeOfStudy)).toHaveLength(3);
  });

  it('AuditAction has 9 values', () => {
    const expected = [
      'CREATE',
      'UPDATE',
      'DELETE',
      'STATUS_CHANGE',
      'OFFER_DECISION',
      'DOCUMENT_RECEIVED',
      'DOCUMENT_WAIVED',
      'INTERVIEW_OUTCOME',
      'CONFIRMED_ORDINAND',
    ];
    expect(Object.values(AuditAction)).toEqual(expect.arrayContaining(expected));
    expect(Object.values(AuditAction)).toHaveLength(9);
  });
});

describe('US-01: Prisma Schema Models — field shapes via create input types', () => {
  it('User model has required fields: name, email and optional role, isActive', () => {
    // Type-level assertion: if the schema is wrong, this won't compile.
    const input: Prisma.UserCreateInput = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMISSIONS_STAFF',
      isActive: true,
    };
    expect(input.name).toBe('Test User');
    expect(input.email).toBe('test@example.com');
  });

  it('Applicant model requires legalName and allows all PRD §6.1 fields', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Jane Doe',
      preferredName: 'Jane',
      dateOfBirth: new Date('1990-01-01'),
      email: 'jane@example.com',
      phone: '+44123456789',
      addressLineOne: '1 High Street',
      city: 'Oxford',
      postcode: 'OX1 1AA',
      country: 'United Kingdom',
      status: 'ENQUIRY',
      hasStageOneBAPException: false,
    };
    expect(input.legalName).toBe('Jane Doe');
  });

  it('EcclesialProfile has DDO and sponsoring bishop fields', () => {
    const input: Prisma.EcclesialProfileCreateWithoutApplicantInput = {
      directorOfOrdinandsName: 'Rev Smith',
      directorOfOrdinandsEmail: 'smith@diocese.org',
      sponsoringBishopName: 'Bishop Jones',
      sponsoringBishopEmail: 'jones@diocese.org',
    };
    expect(input.directorOfOrdinandsName).toBe('Rev Smith');
  });

  it('BAPStatus has stage one and stage two fields', () => {
    const input: Prisma.BAPStatusCreateWithoutApplicantInput = {
      stageOneStatus: 'COMPLETED',
      stageOneDate: new Date('2024-06-01'),
      stageTwoStatus: 'SCHEDULED',
      stageTwoDate: new Date('2025-01-15'),
    };
    expect(input.stageOneStatus).toBe('COMPLETED');
  });

  it('AcademicProgramme has awarding framework, course title, mode of study', () => {
    const input: Prisma.AcademicProgrammeCreateInput = {
      awardingFramework: 'COMMON_AWARDS',
      courseTitle: 'BA Theology',
      durationOfStudy: '3 years',
      modeOfStudy: 'FULL_TIME',
    };
    expect(input.courseTitle).toBe('BA Theology');
  });

  it('Interview has type, scheduling, outcome, and user relations', () => {
    const input: Prisma.InterviewCreateWithoutApplicantInput = {
      interviewType: 'VISIT_INTERVIEW',
      status: 'SCHEDULED',
      scheduledAt: new Date('2025-03-01T10:00:00Z'),
      outcome: 'RECOMMENDED',
      notes: 'Strong candidate',
    };
    expect(input.interviewType).toBe('VISIT_INTERVIEW');
  });

  it('Offer has offerType, conditions, decision dates', () => {
    const input: Prisma.OfferCreateWithoutApplicantInput = {
      offerType: 'CONDITIONAL',
      decisionDate: new Date(),
      conditions: 'Subject to Stage 2 BAP',
      decisionNotes: 'Approved by panel',
    };
    expect(input.offerType).toBe('CONDITIONAL');
  });

  it('Registration has form-received, confirmations, and electronic signature', () => {
    const input: Prisma.RegistrationCreateWithoutApplicantInput = {
      registrationFormReceivedAt: new Date(),
      contactDetailsConfirmed: true,
      programmeConfirmed: true,
      bishopDetailsConfirmed: true,
      areSupportingDocumentsSubmitted: true,
      electronicSignature: true,
    };
    expect(input.contactDetailsConfirmed).toBe(true);
  });

  it('ApplicantDocument has document type, status flags, storage fields', () => {
    const input: Prisma.ApplicantDocumentCreateWithoutApplicantInput = {
      isRequired: true,
      isReceived: false,
      isWaived: false,
      storageProvider: 'sharepoint',
      storageUrl: 'https://sharepoint.example.com/doc1',
      fileName: 'transcript.pdf',
      notes: 'Awaiting upload',
    };
    expect(input.isRequired).toBe(true);
  });

  it('AccommodationRequest has type, duration, family unit size', () => {
    const input: Prisma.AccommodationRequestCreateWithoutApplicantInput = {
      isAccommodationRequired: true,
      accommodationType: 'FAMILY',
      duration: 'FULL_YEAR',
      familyUnitSize: 3,
      totalAccommodationDemand: 1,
    };
    expect(input.accommodationType).toBe('FAMILY');
  });

  it('AuditLog has entityType, entityId, action, previous/new values', () => {
    const input: Prisma.AuditLogCreateInput = {
      entityType: 'Applicant',
      id: 'cuid123',
      action: 'STATUS_CHANGE',
      previousValue: 'ENQUIRY',
      newValue: 'VISIT_INVITED',
    };
    expect(input.action).toBe('STATUS_CHANGE');
  });

  it('Diocese reference data model has name and isActive', () => {
    const input: Prisma.DioceseCreateInput = {
      name: 'Diocese of Oxford',
      isActive: true,
    };
    expect(input.name).toBe('Diocese of Oxford');
  });

  it('DocumentType reference data model has name and isActive', () => {
    const input: Prisma.DocumentTypeCreateInput = {
      name: 'GCSE_TRANSCRIPT',
      isActive: true,
    };
    expect(input.name).toBe('GCSE_TRANSCRIPT');
  });

  it('AdmissionsYear reference data model has label, start/end dates', () => {
    const input: Prisma.AdmissionsYearCreateInput = {
      label: '2025-26',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      isCurrent: true,
    };
    expect(input.label).toBe('2025-26');
  });
});

describe('US-01: Prisma Schema Relationships', () => {
  it('Applicant can be created with nested ecclesial profile (one-to-one)', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      ecclesialProfile: {
        create: {
          directorOfOrdinandsName: 'Rev Test',
        },
      },
    };
    expect(input.ecclesialProfile).toBeDefined();
  });

  it('Applicant can be created with nested BAP status (one-to-one)', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      bapStatus: {
        create: {
          stageOneStatus: 'COMPLETED',
        },
      },
    };
    expect(input.bapStatus).toBeDefined();
  });

  it('Applicant can be created with nested offer (one-to-one)', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      offer: {
        create: {
          offerType: 'CONDITIONAL',
          conditions: 'Stage 2 BAP completion',
        },
      },
    };
    expect(input.offer).toBeDefined();
  });

  it('Applicant can be created with nested registration (one-to-one)', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      registration: {
        create: {},
      },
    };
    expect(input.registration).toBeDefined();
  });

  it('Applicant can be created with nested accommodation request (one-to-one)', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      accommodationRequest: {
        create: {
          isAccommodationRequired: true,
          accommodationType: 'SINGLE',
          duration: 'TERM_TIME',
        },
      },
    };
    expect(input.accommodationRequest).toBeDefined();
  });

  it('Applicant can be created with nested documents (one-to-many)', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      documents: {
        create: [
          { isRequired: true, fileName: 'transcript.pdf' },
          { isRequired: true, fileName: 'reference.pdf' },
        ],
      },
    };
    expect(input.documents).toBeDefined();
  });

  it('Applicant can be created with nested interviews (one-to-many)', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      interviews: {
        create: [
          { interviewType: 'VISIT_INTERVIEW', status: 'SCHEDULED' },
        ],
      },
    };
    expect(input.interviews).toBeDefined();
  });

  it('Applicant can connect to diocese, programme, and admissions year', () => {
    const input: Prisma.ApplicantCreateInput = {
      legalName: 'Test Applicant',
      diocese: { connect: { id: 'diocese-1' } },
      programme: { connect: { id: 'prog-1' } },
      admissionsYear: { connect: { id: 'year-1' } },
    };
    expect(input.diocese).toBeDefined();
    expect(input.programme).toBeDefined();
    expect(input.admissionsYear).toBeDefined();
  });
});
