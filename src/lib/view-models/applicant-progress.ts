import { PROGRESS_STAGES, isStatusAtOrPast } from '@/lib/constants/applicant-status';
import type { ApplicantStatus } from '@/generated/prisma/client';

export interface ApplicantProgressStageViewModel {
  status: ApplicantStatus;
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}

const VISIT_STATUSES: ApplicantStatus[] = [
  'VISIT_INVITED',
  'INTERVIEW_APPLICATION_RECEIVED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
];

const OFFER_STATUSES: ApplicantStatus[] = [
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
];

const REGISTRATION_STATUSES: ApplicantStatus[] = [
  'REGISTRATION_FORM_RECEIVED',
  'DOCUMENTS_COMPLETE',
];

function isCurrentStage(currentStatus: ApplicantStatus, stageStatus: ApplicantStatus): boolean {
  if (currentStatus === stageStatus) {
    return true;
  }

  if (stageStatus === 'VISIT_INVITED') {
    return VISIT_STATUSES.includes(currentStatus);
  }

  if (stageStatus === 'CONDITIONAL_OFFER') {
    return OFFER_STATUSES.includes(currentStatus);
  }

  if (stageStatus === 'REGISTRATION_FORM_RECEIVED') {
    return REGISTRATION_STATUSES.includes(currentStatus);
  }

  return false;
}

export function getApplicantProgressStages(currentStatus: ApplicantStatus): ApplicantProgressStageViewModel[] {
  return PROGRESS_STAGES.map((stage, index) => ({
    ...stage,
    isCompleted: isStatusAtOrPast(currentStatus, stage.status),
    isCurrent: isCurrentStage(currentStatus, stage.status),
    isLast: index === PROGRESS_STAGES.length - 1,
  }));
}
