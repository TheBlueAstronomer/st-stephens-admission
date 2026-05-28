import { describe, it, expect } from 'vitest';
import { validateInterviewGate } from '@/features/interviews/business-rules/interview-gate';
import { requiresInterviewCheck } from '@/features/admissions-lifecycle/business-rules/status-transitions';

describe('Interview Gate — validateInterviewGate', () => {
  it('passes when an interview is COMPLETED', () => {
    const result = validateInterviewGate([{ status: 'COMPLETED' }]);
    expect(result.allowed).toBe(true);
  });

  it('passes when an interview is NOT_REQUIRED', () => {
    const result = validateInterviewGate([{ status: 'NOT_REQUIRED' }]);
    expect(result.allowed).toBe(true);
  });

  it('passes with mixed statuses including COMPLETED', () => {
    const result = validateInterviewGate([
      { status: 'CANCELLED' },
      { status: 'COMPLETED' },
    ]);
    expect(result.allowed).toBe(true);
  });

  it('blocks when only SCHEDULED interviews exist', () => {
    const result = validateInterviewGate([{ status: 'SCHEDULED' }]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('blocks when all interviews are CANCELLED', () => {
    const result = validateInterviewGate([
      { status: 'CANCELLED' },
      { status: 'CANCELLED' },
    ]);
    expect(result.allowed).toBe(false);
  });

  it('blocks when only REQUIRED interviews exist', () => {
    const result = validateInterviewGate([{ status: 'REQUIRED' }]);
    expect(result.allowed).toBe(false);
  });

  it('passes when no interviews exist', () => {
    const result = validateInterviewGate([]);
    expect(result.allowed).toBe(true);
  });
});

describe('requiresInterviewCheck', () => {
  it('returns true for CONDITIONAL_OFFER', () => {
    expect(requiresInterviewCheck('CONDITIONAL_OFFER')).toBe(true);
  });

  it('returns true for UNCONDITIONAL_OFFER', () => {
    expect(requiresInterviewCheck('UNCONDITIONAL_OFFER')).toBe(true);
  });

  it('returns false for INTERVIEW_SCHEDULED', () => {
    expect(requiresInterviewCheck('INTERVIEW_SCHEDULED')).toBe(false);
  });

  it('returns false for ENQUIRY', () => {
    expect(requiresInterviewCheck('ENQUIRY')).toBe(false);
  });

  it('returns false for INTERVIEW_COMPLETED', () => {
    expect(requiresInterviewCheck('INTERVIEW_COMPLETED')).toBe(false);
  });
});
