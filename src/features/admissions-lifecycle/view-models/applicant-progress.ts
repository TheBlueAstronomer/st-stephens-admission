import { PROGRESS_STAGES, isStatusAtOrPast } from '@/features/admissions-lifecycle/constants/applicant-status';
import { parseAuditValue } from '@/lib/audit-log';
import type { AuditAction, ApplicantStatus } from '@/generated/prisma/client';

export interface ApplicantProgressStageViewModel {
  status: ApplicantStatus;
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
  completedAt: Date | null;
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

/** Maps each journey stage to the set of statuses that count as "entering" it. */
const STAGE_ENTRY_STATUSES: Record<string, ApplicantStatus[]> = {
  ENQUIRY: ['ENQUIRY'],
  VISIT_INVITED: VISIT_STATUSES,
  CONDITIONAL_OFFER: OFFER_STATUSES,
  REGISTRATION_FORM_RECEIVED: REGISTRATION_STATUSES,
  CONFIRMED_ORDINAND: ['CONFIRMED_ORDINAND'],
};

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

interface AuditLogEntry {
  action: AuditAction;
  newValue: string | null;
  performedAt: Date;
}

export function getApplicantProgressStages(
  currentStatus: ApplicantStatus,
  auditLogs: AuditLogEntry[] = [],
): ApplicantProgressStageViewModel[] {
  return PROGRESS_STAGES.map((stage, index) => {
    const isCompleted = isStatusAtOrPast(currentStatus, stage.status);
    const isCurrent = isCurrentStage(currentStatus, stage.status);

    let completedAt: Date | null = null;
    if (isCompleted && !isCurrent) {
      const entryStatuses = STAGE_ENTRY_STATUSES[stage.status] ?? [stage.status];
      const matchingLog = [...auditLogs]
        .sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime())
        .find((log) => {
          if (log.action !== 'STATUS_CHANGE') return false;
          const parsed = parseAuditValue(log.newValue);
          return (
            parsed !== null &&
            typeof parsed.value === 'string' &&
            entryStatuses.includes(parsed.value as ApplicantStatus)
          );
        });
      if (matchingLog) {
        completedAt = new Date(matchingLog.performedAt);
      }
    }

    return {
      ...stage,
      isCompleted,
      isCurrent,
      isLast: index === PROGRESS_STAGES.length - 1,
      completedAt,
    };
  });
}
