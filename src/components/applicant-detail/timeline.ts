import { formatAuditValue } from '@/lib/audit-log';
import type { AuditAction } from '@/generated/prisma/client';

export function formatAuditAction(action: AuditAction): string {
  const map: Record<string, string> = {
    CREATE: 'created this record',
    UPDATE: 'updated',
    DELETE: 'deleted',
    STATUS_CHANGE: 'changed status',
    OFFER_DECISION: 'recorded offer decision',
    DOCUMENT_RECEIVED: 'received document',
    DOCUMENT_WAIVED: 'waived document',
    INTERVIEW_OUTCOME: 'recorded interview outcome',
    INTERVIEW_SCHEDULED: 'scheduled interview',
    INVITATION_SENT: 'marked invitation as sent',
    APPLICATION_RECEIVED: 'marked application as received',
    CONFIRMED_ORDINAND: 'confirmed ordinand status',
  };

  return map[action] ?? action;
}

export function formatAuditTimelineEntry(log: {
  action: AuditAction;
  previousValue?: string | null;
  newValue?: string | null;
}): string {
  const actionText = formatAuditAction(log.action);

  if (log.previousValue && log.newValue) {
    return `${actionText}: ${formatAuditValue(log.previousValue)} → ${formatAuditValue(log.newValue)}`;
  }

  if (log.newValue) {
    return `${actionText}: ${formatAuditValue(log.newValue)}`;
  }

  return actionText;
}
