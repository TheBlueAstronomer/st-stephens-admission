import { describe, it, expect } from 'vitest';
import { scheduleInterviewSchema, recordOutcomeSchema, saveNotesSchema } from '@/features/interviews/validations/interview';

describe('Interview Scheduling — Validation', () => {
  describe('scheduleInterviewSchema', () => {
    it('accepts valid scheduling input', () => {
      const input = {
        applicantId: 'test-applicant-id',
        interviewType: 'VISIT_INTERVIEW' as const,
        scheduledAt: '2025-07-14T10:00:00.000Z',
        interviewerIds: ['user-1'],
      };
      const result = scheduleInterviewSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts EXPLORATORY_VISIT type', () => {
      const input = {
        applicantId: 'test-applicant-id',
        interviewType: 'EXPLORATORY_VISIT' as const,
        scheduledAt: '2025-07-14T10:00:00.000Z',
        interviewerIds: ['user-1', 'user-2'],
      };
      const result = scheduleInterviewSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects empty applicantId', () => {
      const input = {
        applicantId: '',
        interviewType: 'VISIT_INTERVIEW' as const,
        scheduledAt: '2025-07-14T10:00:00.000Z',
        interviewerIds: ['user-1'],
      };
      const result = scheduleInterviewSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects invalid interview type', () => {
      const input = {
        applicantId: 'test-applicant-id',
        interviewType: 'INVALID_TYPE',
        scheduledAt: '2025-07-14T10:00:00.000Z',
        interviewerIds: ['user-1'],
      };
      const result = scheduleInterviewSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty interviewerIds array', () => {
      const input = {
        applicantId: 'test-applicant-id',
        interviewType: 'VISIT_INTERVIEW' as const,
        scheduledAt: '2025-07-14T10:00:00.000Z',
        interviewerIds: [],
      };
      const result = scheduleInterviewSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const input = {
        applicantId: 'test-applicant-id',
        interviewType: 'VISIT_INTERVIEW' as const,
        scheduledAt: 'not-a-date',
        interviewerIds: ['user-1'],
      };
      const result = scheduleInterviewSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing scheduledAt', () => {
      const input = {
        applicantId: 'test-applicant-id',
        interviewType: 'VISIT_INTERVIEW' as const,
        scheduledAt: '',
        interviewerIds: ['user-1'],
      };
      const result = scheduleInterviewSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('recordOutcomeSchema', () => {
    it('accepts valid outcome input', () => {
      const input = {
        interviewId: 'interview-1',
        notes: 'Good candidate',
        outcome: 'RECOMMENDED' as const,
        followUpActions: 'Send offer letter',
      };
      const result = recordOutcomeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts all outcome values', () => {
      for (const outcome of ['RECOMMENDED', 'NOT_RECOMMENDED', 'DEFERRED', 'WITHDRAWN']) {
        const input = {
          interviewId: 'interview-1',
          outcome,
        };
        const result = recordOutcomeSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid outcome', () => {
      const input = {
        interviewId: 'interview-1',
        outcome: 'MAYBE',
      };
      const result = recordOutcomeSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('accepts empty notes and followUpActions', () => {
      const input = {
        interviewId: 'interview-1',
        notes: '',
        outcome: 'RECOMMENDED' as const,
        followUpActions: '',
      };
      const result = recordOutcomeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('saveNotesSchema', () => {
    it('accepts valid notes input', () => {
      const input = {
        interviewId: 'interview-1',
        notes: 'Draft notes',
        followUpActions: '',
      };
      const result = saveNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects missing interviewId', () => {
      const input = {
        interviewId: '',
        notes: 'Draft notes',
      };
      const result = saveNotesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
