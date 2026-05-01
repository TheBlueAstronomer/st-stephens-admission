import type { ApplicantStatus } from '@/generated/prisma/client';

export const STATUS_COLORS: Record<ApplicantStatus, { bg: string; text: string }> = {
  ENQUIRY: { bg: '#EEF2FF', text: '#3730A3' },
  VISIT_INVITED: { bg: '#FFF7ED', text: '#C2410C' },
  INTERVIEW_APPLICATION_RECEIVED: { bg: '#ECFDF5', text: '#065F46' },
  INTERVIEW_SCHEDULED: { bg: '#ECFDF5', text: '#065F46' },
  INTERVIEW_COMPLETED: { bg: '#D1FAE5', text: '#064E3B' },
  CONDITIONAL_OFFER: { bg: '#FFFBEB', text: '#92400E' },
  UNCONDITIONAL_OFFER: { bg: '#F0FDF4', text: '#14532D' },
  DECLINED: { bg: '#FEF2F2', text: '#991B1B' },
  WITHDRAWN: { bg: '#F9FAFB', text: '#374151' },
  REGISTRATION_FORM_RECEIVED: { bg: '#EEF2FF', text: '#3730A3' },
  DOCUMENTS_COMPLETE: { bg: '#D1FAE5', text: '#064E3B' },
  CONFIRMED_ORDINAND: { bg: '#1A2744', text: '#FFFFFF' },
};

export const STATUS_LABELS: Record<ApplicantStatus, string> = {
  ENQUIRY: 'Enquiry',
  VISIT_INVITED: 'Visit Invited',
  INTERVIEW_APPLICATION_RECEIVED: 'Application Received',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEW_COMPLETED: 'Interview Completed',
  CONDITIONAL_OFFER: 'Conditional Offer',
  UNCONDITIONAL_OFFER: 'Unconditional Offer',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
  REGISTRATION_FORM_RECEIVED: 'Registration Received',
  DOCUMENTS_COMPLETE: 'Documents Complete',
  CONFIRMED_ORDINAND: 'Confirmed Ordinand',
};

export const PROGRESS_STAGES: { status: ApplicantStatus; label: string }[] = [
  { status: 'ENQUIRY', label: 'Enquiry' },
  { status: 'VISIT_INVITED', label: 'Visit / Interview' },
  { status: 'CONDITIONAL_OFFER', label: 'Offer Decision' },
  { status: 'REGISTRATION_FORM_RECEIVED', label: 'Registration' },
  { status: 'CONFIRMED_ORDINAND', label: 'Confirmed Ordinand' },
];

// Ordered for comparing progress
const STATUS_ORDER: ApplicantStatus[] = [
  'ENQUIRY',
  'VISIT_INVITED',
  'INTERVIEW_APPLICATION_RECEIVED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
  'REGISTRATION_FORM_RECEIVED',
  'DOCUMENTS_COMPLETE',
  'CONFIRMED_ORDINAND',
];

export function getStatusIndex(status: ApplicantStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export function isStatusAtOrPast(
  current: ApplicantStatus,
  target: ApplicantStatus,
): boolean {
  if (current === 'DECLINED' || current === 'WITHDRAWN') return false;
  return getStatusIndex(current) >= getStatusIndex(target);
}
