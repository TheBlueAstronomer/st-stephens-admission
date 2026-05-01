import { z } from 'zod';

/**
 * Zod schema for scheduling an interview.
 */
export const scheduleInterviewSchema = z.object({
  applicantId: z.string().min(1, 'Applicant ID is required'),
  interviewType: z.enum(['EXPLORATORY_VISIT', 'VISIT_INTERVIEW'], {
    message: 'Interview type must be Exploratory Visit or Visit-Interview',
  }),
  scheduledAt: z.string().min(1, 'Date and time are required').refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date/time format' },
  ),
  interviewerIds: z
    .array(z.string().min(1))
    .min(1, 'At least one interviewer must be assigned'),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;

/**
 * Zod schema for recording interview outcome.
 */
export const recordOutcomeSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  notes: z.string().optional().or(z.literal('')),
  outcome: z.enum(['RECOMMENDED', 'NOT_RECOMMENDED', 'DEFERRED', 'WITHDRAWN'], {
    message: 'Outcome is required',
  }),
  followUpActions: z.string().optional().or(z.literal('')),
});

export type RecordOutcomeInput = z.infer<typeof recordOutcomeSchema>;

/**
 * Zod schema for saving interview notes (partial save without completing).
 */
export const saveNotesSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  notes: z.string().optional().or(z.literal('')),
  followUpActions: z.string().optional().or(z.literal('')),
});

export type SaveNotesInput = z.infer<typeof saveNotesSchema>;
