import { describe, it, expect } from 'vitest';
import { createOfferSchema } from '@/features/offers/validations/offer';

describe('createOfferSchema', () => {
  const baseInput = {
    applicantId: 'applicant-123',
    decisionDate: '2025-07-14',
    conditions: [],
  };

  describe('UNCONDITIONAL offer', () => {
    it('succeeds with no conditions', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'UNCONDITIONAL',
      });
      expect(result.success).toBe(true);
    });

    it('succeeds with conditions provided (conditions are ignored for unconditional)', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'UNCONDITIONAL',
        conditions: ['Some condition'],
      });
      expect(result.success).toBe(true);
    });

    it('succeeds with optional decisionNotes', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'UNCONDITIONAL',
        decisionNotes: 'Offer approved by committee.',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CONDITIONAL offer', () => {
    it('is blocked when conditions array is empty', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'CONDITIONAL',
        conditions: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const conditionErrors = result.error.flatten().fieldErrors['conditions'];
        expect(conditionErrors).toBeDefined();
        expect(conditionErrors?.join(' ')).toContain('at least one condition');
      }
    });

    it('succeeds with one condition', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'CONDITIONAL',
        conditions: ['Subject to successful Stage 2 BAP'],
      });
      expect(result.success).toBe(true);
    });

    it('succeeds with multiple conditions', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'CONDITIONAL',
        conditions: ['Stage 2 BAP required', 'Medical clearance required'],
      });
      expect(result.success).toBe(true);
    });

    it('is blocked when conditions contains an empty string', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'CONDITIONAL',
        conditions: [''],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DECLINED offer', () => {
    it('succeeds with no conditions required', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'DECLINED',
        conditions: [],
      });
      expect(result.success).toBe(true);
    });

    it('stores decisionNotes as the reason', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'DECLINED',
        decisionNotes: 'Does not meet theological formation requirements.',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.decisionNotes).toBe('Does not meet theological formation requirements.');
      }
    });
  });

  describe('WITHDRAWN offer', () => {
    it('succeeds with a reason in decisionNotes', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'WITHDRAWN',
        decisionNotes: 'Applicant chose to withdraw from the process.',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.decisionNotes).toBe('Applicant chose to withdraw from the process.');
      }
    });
  });

  describe('required fields', () => {
    it('is blocked when applicantId is empty', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        applicantId: '',
        offerType: 'UNCONDITIONAL',
      });
      expect(result.success).toBe(false);
    });

    it('is blocked when decisionDate is empty', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        decisionDate: '',
        offerType: 'UNCONDITIONAL',
      });
      expect(result.success).toBe(false);
    });

    it('is blocked with invalid offerType', () => {
      const result = createOfferSchema.safeParse({
        ...baseInput,
        offerType: 'INVALID_TYPE',
      });
      expect(result.success).toBe(false);
    });
  });
});
