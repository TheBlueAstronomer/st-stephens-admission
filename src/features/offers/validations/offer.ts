import { z } from 'zod';

export const offerTypeEnum = z.enum(['CONDITIONAL', 'UNCONDITIONAL', 'DECLINED', 'WITHDRAWN']);

export const createOfferSchema = z
  .object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    offerType: offerTypeEnum,
    decisionDate: z.string().min(1, 'Decision date is required'),
    conditions: z.array(z.string().min(1, 'Condition cannot be empty')).default([]),
    decisionNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.offerType === 'CONDITIONAL') {
        return data.conditions.length >= 1;
      }
      return true;
    },
    {
      message: 'Conditional offers must include at least one condition.',
      path: ['conditions'],
    },
  );

export const acceptOfferSchema = z.object({
  applicantId: z.string().min(1),
  acceptedAt: z.string().optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type AcceptOfferInput = z.infer<typeof acceptOfferSchema>;
