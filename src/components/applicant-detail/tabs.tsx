'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  FileTextIcon,
  PaperPlaneTiltIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';
import { markApplicationReceived, markInvitationSent } from '@/app/(staff)/interviews/actions';
import {
  DetailField,
  EmptyState,
  type ApplicantFull,
  type ApplicantInterview,
  type AvailableInterviewer,
} from '@/components/applicant-detail/shared';
import { formatAuditAction } from '@/components/applicant-detail/timeline';
import { formatAuditValue } from '@/lib/audit-log';
import { formatDate, formatDateTime, formatTime } from '@/lib/formatters/date';
import { useActionExecutor } from '@/hooks/use-action-executor';

function renderPanelMembers(interview: ApplicantInterview) {
  if (interview.panelMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <UserCircleIcon size={14} weight="light" />
      <span>Panel: </span>
      {interview.panelMembers.map((pm, idx, arr) => (
        <span key={pm.user.id}>
          {pm.user.name}
          {idx < arr.length - 1 ? ', ' : ''}
        </span>
      ))}
    </div>
  );
}

export function PersonalTab({ applicant }: { applicant: ApplicantFull }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <DetailField label="Legal Name" value={applicant.legalName} />
      <DetailField label="Preferred Name" value={applicant.preferredName} />
      <DetailField label="Date of Birth" value={applicant.dateOfBirth ? formatDate(applicant.dateOfBirth) : null} />
      <DetailField label="Email" value={applicant.email} />
      <DetailField label="Phone" value={applicant.phone} />
      <DetailField label="Address" value={[applicant.addressLineOne, applicant.addressLineTwo, applicant.city, applicant.postcode, applicant.country].filter(Boolean).join(', ') || null} />
      <DetailField label="Programme" value={applicant.programme?.courseTitle} />
    </dl>
  );
}

export function EcclesialTab({ applicant }: { applicant: ApplicantFull }) {
  const ep = applicant.ecclesialProfile;
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <DetailField label="Diocese" value={applicant.diocese?.name} />
      <DetailField label="DDO Name" value={ep?.directorOfOrdinandsName} />
      <DetailField label="DDO Email" value={ep?.directorOfOrdinandsEmail} />
      <DetailField label="DDO Phone" value={ep?.directorOfOrdinandsPhone} />
      <DetailField label="Sponsoring Bishop" value={ep?.sponsoringBishopName} />
      <DetailField label="Bishop Email" value={ep?.sponsoringBishopEmail} />
    </dl>
  );
}

export function BAPTab({ applicant }: { applicant: ApplicantFull }) {
  const bap = applicant.bapStatus;
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
        <DetailField label="Stage 1 Status" value={bap?.stageOneStatus} />
        <DetailField label="Stage 1 Date" value={bap?.stageOneDate ? formatDate(bap.stageOneDate) : null} />
        <DetailField label="Stage 2 Status" value={bap?.stageTwoStatus} />
        <DetailField label="Stage 2 Date" value={bap?.stageTwoDate ? formatDate(bap.stageTwoDate) : null} />
      </dl>
      {applicant.hasStageOneBAPException && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <strong>BAP Exception recorded:</strong> {applicant.stageOneBAPExceptionReason}
        </Alert>
      )}
      {bap && bap.stageOneStatus !== 'COMPLETED' && bap.stageOneStatus !== 'SCHEDULED' && !applicant.hasStageOneBAPException && (
        <Alert variant="destructive">
          Stage 1 BAP must be Completed or Scheduled before progressing past Enquiry.
          You may record an exception with a reason to bypass this requirement.
        </Alert>
      )}
    </div>
  );
}

export function InterviewTab({
  applicant,
  canEdit,
  availableInterviewers,
}: {
  applicant: ApplicantFull;
  canEdit: boolean;
  availableInterviewers: AvailableInterviewer[];
}) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const { isPending, executeAction } = useActionExecutor();

  const handleMarkInvitationSent = (interviewId: string) => {
    executeAction({
      action: () => markInvitationSent(interviewId),
      successMessage: 'Invitation marked as sent.',
      errorMessage: 'Failed to mark invitation.',
      refresh: true,
    });
  };

  const handleMarkApplicationReceived = (interviewId: string) => {
    executeAction({
      action: () => markApplicationReceived(interviewId),
      successMessage: 'Application marked as received.',
      errorMessage: 'Failed to mark application.',
      refresh: true,
    });
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90"
            onClick={() => setShowScheduleDialog(true)}
          >
            <CalendarBlankIcon size={16} weight="light" className="mr-2" />
            Schedule Interview
          </Button>
        </div>
      )}

      {applicant.interviews.length === 0 ? (
        <EmptyState message="No interviews recorded yet." />
      ) : (
        applicant.interviews.map((interview) => (
          <div key={interview.id} className="rounded-2xl border border-black/6 bg-canvas p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="border-0 bg-brand-solid text-brand-solid-foreground text-xs">
                  {interview.interviewType === 'EXPLORATORY_VISIT' ? 'Exploratory Visit' : 'Visit-Interview'}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    interview.status === 'COMPLETED'
                      ? 'border-green-300 text-green-800 bg-green-50'
                      : interview.status === 'SCHEDULED'
                        ? 'border-blue-300 text-blue-800 bg-blue-50'
                        : interview.status === 'CANCELLED'
                          ? 'border-red-300 text-red-800 bg-red-50'
                          : ''
                  }`}
                >
                  {interview.status}
                </Badge>
              </div>
              <Link
                href={`/interviews/${interview.id}`}
                className="text-xs font-medium text-brand-ink hover:underline"
              >
                View Details →
              </Link>
            </div>

            {interview.scheduledAt && (
              <p className="text-sm text-muted-foreground">
                <CalendarBlankIcon size={14} weight="light" className="inline mr-1" />
                {formatDateTime(
                  interview.scheduledAt,
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  },
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}
              </p>
            )}

            {renderPanelMembers(interview)}

            <div className="flex items-center gap-2 flex-wrap">
              {interview.invitationSentAt ? (
                <Badge className="border-0 bg-green-100 text-green-800 text-xs">
                  <PaperPlaneTiltIcon size={12} weight="fill" className="mr-1" />
                  Invitation Sent {formatDate(interview.invitationSentAt, { day: 'numeric', month: 'short' })}
                </Badge>
              ) : canEdit && interview.status === 'SCHEDULED' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-brand-ink"
                  disabled={isPending}
                  onClick={() => handleMarkInvitationSent(interview.id)}
                >
                  <PaperPlaneTiltIcon size={12} weight="light" className="mr-1" />
                  Mark Invitation Sent
                </Button>
              ) : null}

              {interview.interviewApplicationReceivedAt ? (
                <Badge className="border-0 bg-green-100 text-green-800 text-xs">
                  <FileTextIcon size={12} weight="fill" className="mr-1" />
                  Application Received {formatDate(interview.interviewApplicationReceivedAt, { day: 'numeric', month: 'short' })}
                </Badge>
              ) : canEdit && interview.status === 'SCHEDULED' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-brand-ink"
                  disabled={isPending}
                  onClick={() => handleMarkApplicationReceived(interview.id)}
                >
                  <FileTextIcon size={12} weight="light" className="mr-1" />
                  Mark Application Received
                </Button>
              ) : null}
            </div>

            {interview.outcome && (
              <div className="rounded-lg bg-white border border-black/4 p-3 text-sm">
                <p className="font-medium">
                  Outcome:{' '}
                  <span className={
                    interview.outcome === 'RECOMMENDED'
                      ? 'text-green-700'
                      : interview.outcome === 'NOT_RECOMMENDED'
                        ? 'text-red-700'
                        : 'text-amber-700'
                  }>
                    {interview.outcome.replace('_', ' ')}
                  </span>
                </p>
                {interview.notes && (
                  <p className="text-muted-foreground mt-1">{interview.notes}</p>
                )}
              </div>
            )}
          </div>
        ))
      )}

      <ScheduleInterviewDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        applicantId={applicant.id}
        applicantName={applicant.preferredName ?? applicant.legalName}
        applicantDisplayId={applicant.applicantId}
        bapStageOneStatus={applicant.bapStatus?.stageOneStatus ?? null}
        hasStageOneBAPException={applicant.hasStageOneBAPException}
        availableInterviewers={availableInterviewers}
      />
    </div>
  );
}

export function OfferTab({ applicant }: { applicant: ApplicantFull }) {
  if (!applicant.offer) {
    return <EmptyState message="No offer decision recorded yet." />;
  }
  const o = applicant.offer;
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <DetailField label="Offer Type" value={o.offerType} />
      <DetailField label="Decision Date" value={o.decisionDate ? formatDate(o.decisionDate) : null} />
      <DetailField label="Conditions" value={o.conditions} />
      <DetailField label="Decision Notes" value={o.decisionNotes} />
    </dl>
  );
}

export function RegistrationTab({ applicant }: { applicant: ApplicantFull }) {
  if (!applicant.registration) {
    return <EmptyState message="No registration form received yet." />;
  }
  const r = applicant.registration;
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <DetailField label="Form Received" value={r.registrationFormReceivedAt ? formatDate(r.registrationFormReceivedAt) : null} />
      <DetailField label="Contact Confirmed" value={r.contactDetailsConfirmed ? 'Yes' : 'No'} />
      <DetailField label="Programme Confirmed" value={r.programmeConfirmed ? 'Yes' : 'No'} />
      <DetailField label="Bishop Confirmed" value={r.bishopDetailsConfirmed ? 'Yes' : 'No'} />
      <DetailField label="Documents Submitted" value={r.areSupportingDocumentsSubmitted ? 'Yes' : 'No'} />
      <DetailField label="Electronic Signature" value={r.electronicSignature ? 'Yes' : 'No'} />
    </dl>
  );
}

export function DocumentsTab({ applicant }: { applicant: ApplicantFull }) {
  if (applicant.documents.length === 0) {
    return <EmptyState message="No documents tracked yet." />;
  }
  return (
    <div className="space-y-2">
      {applicant.documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-black/6 bg-canvas p-3.5">
          <div>
            <p className="text-sm font-medium">{doc.documentType?.name ?? doc.fileName ?? 'Unknown Document'}</p>
            {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
          </div>
          <div className="flex items-center gap-2">
            {doc.isReceived && <Badge className="bg-green-100 text-green-800 border-0">Received</Badge>}
            {doc.isWaived && <Badge className="bg-gray-100 text-gray-600 border-0">Waived</Badge>}
            {!doc.isReceived && !doc.isWaived && doc.isRequired && (
              <Badge className="bg-red-100 text-red-800 border-0">Outstanding</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotesTab() {
  return <EmptyState message="Notes feature coming in a future update." />;
}

export function TimelineTab({ applicant }: { applicant: ApplicantFull }) {
  if (applicant.auditLogs.length === 0) {
    return <EmptyState message="No audit entries yet." />;
  }
  return (
    <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
      {applicant.auditLogs.map((log) => (
        <div key={log.id} className="flex gap-3 border-l-2 border-brand-ink/10 pl-3 text-sm">
          <span className="shrink-0 font-mono text-xs text-muted-foreground w-32.5">
            {formatDate(log.performedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
            {' '}
            {formatTime(log.performedAt, { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div>
            <span className="font-medium">{log.user?.name ?? 'System'}</span>
            {' '}
            <span className="text-muted-foreground">{formatAuditAction(log.action)}</span>
            {log.previousValue && log.newValue && (
              <span className="text-muted-foreground">
                : {formatAuditValue(log.previousValue)} <ArrowRightIcon size={12} weight="light" className="inline" /> {formatAuditValue(log.newValue)}
              </span>
            )}
            {!log.previousValue && log.newValue && (
              <span className="text-muted-foreground">: {formatAuditValue(log.newValue)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
