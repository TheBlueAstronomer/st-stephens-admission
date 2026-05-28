import { describe, it, expect } from 'vitest';
import { validateBAPGate } from '@/features/admissions-lifecycle/business-rules/bap-gate';

describe('validateBAPGate', () => {
  it('allows when Stage 1 BAP is COMPLETED', () => {
    const result = validateBAPGate({
      stageOneStatus: 'COMPLETED',
      hasException: false,
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('allows when Stage 1 BAP is SCHEDULED', () => {
    const result = validateBAPGate({
      stageOneStatus: 'SCHEDULED',
      hasException: false,
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks when Stage 1 BAP is INCOMPLETE and no exception', () => {
    const result = validateBAPGate({
      stageOneStatus: 'INCOMPLETE',
      hasException: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Stage 1 BAP must be Completed or Scheduled');
  });

  it('blocks when Stage 1 BAP is NOT_APPLICABLE and no exception', () => {
    const result = validateBAPGate({
      stageOneStatus: 'NOT_APPLICABLE',
      hasException: false,
    });
    expect(result.allowed).toBe(false);
  });

  it('allows when exception is marked with a valid reason', () => {
    const result = validateBAPGate({
      stageOneStatus: 'INCOMPLETE',
      hasException: true,
      exceptionReason: 'Candidate from another denomination, BAP not applicable.',
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks when exception is marked but reason is empty', () => {
    const result = validateBAPGate({
      stageOneStatus: 'INCOMPLETE',
      hasException: true,
      exceptionReason: '',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('requires a written reason');
  });

  it('blocks when exception is marked but reason is whitespace only', () => {
    const result = validateBAPGate({
      stageOneStatus: 'INCOMPLETE',
      hasException: true,
      exceptionReason: '   ',
    });
    expect(result.allowed).toBe(false);
  });

  it('blocks when exception is marked but reason is null', () => {
    const result = validateBAPGate({
      stageOneStatus: 'INCOMPLETE',
      hasException: true,
      exceptionReason: null,
    });
    expect(result.allowed).toBe(false);
  });
});
