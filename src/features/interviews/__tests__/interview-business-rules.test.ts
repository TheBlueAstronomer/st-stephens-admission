import { describe, it, expect } from 'vitest';
import { authorizeInterviewAccess } from '@/features/interviews/business-rules/interview-access';
import { validateInterviewGate } from '@/features/interviews/business-rules/interview-gate';

describe('Interview Access Control', () => {
  it('allows ADMISSIONS_STAFF access to any interview', () => {
    const result = authorizeInterviewAccess({
      userId: 'user-1',
      userRole: 'ADMISSIONS_STAFF',
      assignedUserIds: [],
    });
    expect(result.allowed).toBe(true);
  });

  it('allows SYSTEM_ADMINISTRATOR access to any interview', () => {
    const result = authorizeInterviewAccess({
      userId: 'user-1',
      userRole: 'SYSTEM_ADMINISTRATOR',
      assignedUserIds: [],
    });
    expect(result.allowed).toBe(true);
  });

  it('allows assigned ACADEMIC_STAFF access', () => {
    const result = authorizeInterviewAccess({
      userId: 'user-bob',
      userRole: 'ACADEMIC_STAFF',
      assignedUserIds: ['user-bob', 'user-other'],
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks unassigned ACADEMIC_STAFF', () => {
    const result = authorizeInterviewAccess({
      userId: 'user-bob',
      userRole: 'ACADEMIC_STAFF',
      assignedUserIds: ['user-other'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('You are not assigned to this interview.');
  });

  it('blocks SENIOR_LEADERSHIP from interview records', () => {
    const result = authorizeInterviewAccess({
      userId: 'user-1',
      userRole: 'SENIOR_LEADERSHIP',
      assignedUserIds: [],
    });
    expect(result.allowed).toBe(false);
  });
});

describe('Interview Gate (Offer Progression)', () => {
  it('allows when at least one interview is COMPLETED', () => {
    const result = validateInterviewGate([
      { status: 'SCHEDULED' },
      { status: 'COMPLETED' },
    ]);
    expect(result.allowed).toBe(true);
  });

  it('allows when interview is NOT_REQUIRED', () => {
    const result = validateInterviewGate([
      { status: 'NOT_REQUIRED' },
    ]);
    expect(result.allowed).toBe(true);
  });

  it('blocks when interviews exist but none are completed', () => {
    const result = validateInterviewGate([
      { status: 'SCHEDULED' },
    ]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('completed or marked as not required');
  });

  it('allows when no interviews exist (not required)', () => {
    const result = validateInterviewGate([]);
    expect(result.allowed).toBe(true);
  });

  it('blocks when all interviews are cancelled', () => {
    const result = validateInterviewGate([
      { status: 'CANCELLED' },
    ]);
    expect(result.allowed).toBe(false);
  });
});
