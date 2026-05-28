import type { InterviewOutcome, InterviewType } from '@/generated/prisma/client';
import type { InterviewDetailRecord } from '@/features/interviews/queries/interviews';

export type InterviewDetail = InterviewDetailRecord;
export type PanelMember = InterviewDetail['panelMembers'][number];

export const OUTCOME_OPTIONS: { value: InterviewOutcome; label: string; color: string }[] = [
  { value: 'RECOMMENDED', label: 'Recommended', color: 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100' },
  { value: 'NOT_RECOMMENDED', label: 'Not Recommended', color: 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100' },
  { value: 'DEFERRED', label: 'Deferred', color: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100' },
];

export function getInterviewTypeLabel(interviewType: InterviewType): string {
  return interviewType === 'EXPLORATORY_VISIT' ? 'Exploratory Visit' : 'Visit-Interview';
}
