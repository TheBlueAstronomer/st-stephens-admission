import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  requiresBAPCheck,
} from '@/features/admissions-lifecycle/business-rules/status-transitions';
import type { ApplicantStatus } from '@/generated/prisma/client';

describe('isValidTransition', () => {
  it('allows ENQUIRY → VISIT_INVITED', () => {
    const result = isValidTransition('ENQUIRY', 'VISIT_INVITED');
    expect(result.allowed).toBe(true);
  });

  it('allows ENQUIRY → WITHDRAWN', () => {
    const result = isValidTransition('ENQUIRY', 'WITHDRAWN');
    expect(result.allowed).toBe(true);
  });

  it('blocks ENQUIRY → CONFIRMED_ORDINAND (skip)', () => {
    const result = isValidTransition('ENQUIRY', 'CONFIRMED_ORDINAND');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Cannot transition');
    expect(result.reason).toContain('VISIT_INVITED');
  });

  it('blocks ENQUIRY → INTERVIEW_COMPLETED (skip)', () => {
    const result = isValidTransition('ENQUIRY', 'INTERVIEW_COMPLETED');
    expect(result.allowed).toBe(false);
  });

  it('allows INTERVIEW_COMPLETED → CONDITIONAL_OFFER', () => {
    const result = isValidTransition('INTERVIEW_COMPLETED', 'CONDITIONAL_OFFER');
    expect(result.allowed).toBe(true);
  });

  it('allows INTERVIEW_COMPLETED → UNCONDITIONAL_OFFER', () => {
    const result = isValidTransition('INTERVIEW_COMPLETED', 'UNCONDITIONAL_OFFER');
    expect(result.allowed).toBe(true);
  });

  it('allows INTERVIEW_COMPLETED → DECLINED', () => {
    const result = isValidTransition('INTERVIEW_COMPLETED', 'DECLINED');
    expect(result.allowed).toBe(true);
  });

  it('blocks transitions from terminal status DECLINED', () => {
    const result = isValidTransition('DECLINED', 'ENQUIRY');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('terminal status');
  });

  it('blocks transitions from terminal status WITHDRAWN', () => {
    const result = isValidTransition('WITHDRAWN', 'ENQUIRY');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('terminal status');
  });

  it('blocks transitions from terminal status CONFIRMED_ORDINAND', () => {
    const result = isValidTransition('CONFIRMED_ORDINAND', 'ENQUIRY');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('terminal status');
  });

  it('allows the full happy path sequence', () => {
    const happyPath: [string, string][] = [
      ['ENQUIRY', 'VISIT_INVITED'],
      ['VISIT_INVITED', 'INTERVIEW_APPLICATION_RECEIVED'],
      ['INTERVIEW_APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED'],
      ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'],
      ['INTERVIEW_COMPLETED', 'UNCONDITIONAL_OFFER'],
      ['UNCONDITIONAL_OFFER', 'REGISTRATION_FORM_RECEIVED'],
      ['REGISTRATION_FORM_RECEIVED', 'DOCUMENTS_COMPLETE'],
      ['DOCUMENTS_COMPLETE', 'CONFIRMED_ORDINAND'],
    ];
    for (const [from, to] of happyPath) {
      const result = isValidTransition(from as ApplicantStatus, to as ApplicantStatus);
      expect(result.allowed, `${from} → ${to} should be allowed`).toBe(true);
    }
  });
});

describe('requiresBAPCheck', () => {
  it('does NOT require BAP check for ENQUIRY', () => {
    expect(requiresBAPCheck('ENQUIRY')).toBe(false);
  });

  it('requires BAP check for VISIT_INVITED', () => {
    expect(requiresBAPCheck('VISIT_INVITED')).toBe(true);
  });

  it('requires BAP check for CONFIRMED_ORDINAND', () => {
    expect(requiresBAPCheck('CONFIRMED_ORDINAND')).toBe(true);
  });

  it('does NOT require BAP check for WITHDRAWN', () => {
    expect(requiresBAPCheck('WITHDRAWN')).toBe(false);
  });

  it('does NOT require BAP check for DECLINED', () => {
    expect(requiresBAPCheck('DECLINED')).toBe(false);
  });
});
