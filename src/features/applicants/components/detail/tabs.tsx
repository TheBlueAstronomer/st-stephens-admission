'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  ClockCounterClockwiseIcon,
  ArrowSquareOutIcon,
  CheckIcon as PhosphorCheckIcon,
  CopySimpleIcon,
  DotsThreeIcon,
  FileTextIcon,
  FolderOpenIcon,
  GraduationCapIcon,
  ListDashesIcon,
  LockSimpleIcon,
  MinusIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  PlusIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  TextAlignLeftIcon,
  UploadSimpleIcon,
  UserCircleIcon,
  WarningCircleIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScheduleInterviewDialog } from '@/features/interviews/components/schedule-interview-dialog';
import { RecordOfferSheet } from '@/features/offers/components/record-offer-sheet';
import { UploadDocumentDialog, type DocTypeOption } from '@/features/documents/components/upload-document-dialog';
import { WaiveDocumentSheet } from '@/features/documents/components/waive-document-sheet';
import { markApplicationReceived, markInvitationSent } from '@/features/interviews/actions/interview-actions';
import { acceptOffer, markRegistrationReceived, confirmOrdinand } from '@/features/offers/actions/offer-actions';
import { clearDocumentStatus } from '@/features/documents/actions/document-actions';
import {
  DetailField,
  EmptyState,
  type ApplicantFull,
  type ApplicantInterview,
  type AvailableInterviewer,
} from '@/features/applicants/components/detail/shared';
import type { DocumentChecklistItem } from '@/features/documents/queries/documents';
import { formatAuditAction } from '@/features/applicants/components/detail/timeline';
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
  const primaryDocs = applicant.documents.filter(
    (d) => d.isReceived && (d.documentType?.name ?? d.fileName),
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-brand-ink">Personal Information</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Legal details and contact information for the primary applicant record.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <DetailField label="Legal Name" value={applicant.legalName} />
        <DetailField label="Preferred Name" value={applicant.preferredName} />
        <DetailField label="Date of Birth" value={applicant.dateOfBirth ? formatDate(applicant.dateOfBirth) : null} />
        <DetailField label="Email" value={applicant.email} />
        <DetailField label="Phone" value={applicant.phone} />
        <DetailField label="Address" value={[applicant.addressLineOne, applicant.addressLineTwo, applicant.city, applicant.postcode, applicant.country].filter(Boolean).join(', ') || null} />
        <DetailField label="Programme" value={applicant.programme?.courseTitle} />
      </dl>

      {primaryDocs.length > 0 && (
        <div className="pt-2 border-t border-black/6">
          <h4 className="text-sm font-semibold text-brand-ink mb-3">Primary Documents</h4>
          <div className="space-y-2">
            {primaryDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3">
                <FileTextIcon size={16} weight="light" className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-brand-ink">
                    {doc.documentType?.name ?? doc.fileName ?? 'Document'}
                  </p>
                  {doc.receivedAt && (
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatDate(doc.receivedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 border-t border-border pt-2 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/60 p-4 flex flex-col items-center gap-2 text-center">
          <GraduationCapIcon size={20} weight="light" className="text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Programme</span>
          <span className="text-sm font-semibold text-brand-ink leading-snug">
            {applicant.programme?.courseTitle ?? '—'}
          </span>
        </div>
        <div className="rounded-xl bg-muted/60 p-4 flex flex-col items-center gap-2 text-center">
          <ClockCounterClockwiseIcon size={20} weight="light" className="text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Last Updated</span>
          <span className="text-sm font-semibold text-brand-ink">
            {formatDate(applicant.updatedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="rounded-xl bg-muted/60 p-4 flex flex-col items-center gap-2 text-center">
          <ShieldCheckIcon size={20} weight="light" className="text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">DBS Status</span>
          <span className="text-sm font-semibold text-muted-foreground">Not recorded</span>
        </div>
      </div>
    </div>
  );
}

export function EcclesialTab({ applicant }: { applicant: ApplicantFull }) {
  const ep = applicant.ecclesialProfile;
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
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
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
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

const OFFER_TYPE_LABELS: Record<string, string> = {
  UNCONDITIONAL: 'Unconditional Offer',
  CONDITIONAL: 'Conditional Offer',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
};

const OFFER_TYPE_COLORS: Record<string, string> = {
  UNCONDITIONAL: 'bg-green-100 text-green-800',
  CONDITIONAL: 'bg-amber-100 text-amber-800',
  DECLINED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
};

export function OfferTab({ applicant, canEdit }: { applicant: ApplicantFull; canEdit?: boolean }) {
  const [offerSheetOpen, setOfferSheetOpen] = useState(false);
  const { isPending, executeAction } = useActionExecutor();
  const [actionError, setActionError] = useState<string | null>(null);

  const o = applicant.offer;
  const isOfferPresent = !!o;
  const isAccepted = !!o?.acceptedAt;
  const canRecord = canEdit && !['DECLINED', 'WITHDRAWN', 'CONFIRMED_ORDINAND'].includes(applicant.status);
  const canAccept = canEdit && isOfferPresent && !isAccepted && !['DECLINED', 'WITHDRAWN'].includes(o.offerType);

  const handleAccept = () => {
    setActionError(null);
    executeAction({
      action: () => acceptOffer({ applicantId: applicant.id }),
      successMessage: 'Offer accepted successfully.',
      refresh: true,
      onError: (msg) => setActionError(msg),
    });
  };

  if (!isOfferPresent && !canRecord) {
    return <EmptyState message="No offer decision recorded yet." />;
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <Alert variant="destructive" className="flex items-center gap-2">
          <WarningCircleIcon size={16} />
          <span className="text-sm">{actionError}</span>
        </Alert>
      )}

      {!isOfferPresent && (
        <>
          <EmptyState message="No offer decision recorded yet." />
          {canRecord && (
            <div className="flex justify-center pt-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setOfferSheetOpen(true)}
              >
                Record Offer Decision
              </Button>
            </div>
          )}
        </>
      )}

      {isOfferPresent && (
        <div>
          {/* Card header — offer type + acceptance status */}
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${OFFER_TYPE_COLORS[o.offerType] ?? 'bg-gray-100 text-gray-600'} border-0 text-sm font-medium px-3 py-1`}>
                {OFFER_TYPE_LABELS[o.offerType] ?? o.offerType}
              </Badge>
              {isAccepted && (
                <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
                  <CheckCircleIcon size={15} weight="fill" />
                  Accepted {formatDate(o.acceptedAt!)}
                </span>
              )}
            </div>
          </div>

          {/* Decision details */}
          <div className="pb-5 border-b border-border">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Decision Date</dt>
                <dd className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <CalendarBlankIcon size={14} className="text-muted-foreground shrink-0" />
                  {o.decisionDate ? formatDate(o.decisionDate) : '—'}
                </dd>
              </div>
              {isAccepted && (
                <DetailField label="Accepted On" value={formatDate(o.acceptedAt!)} />
              )}
              {o.declinedAt && (
                <DetailField label="Declined On" value={formatDate(o.declinedAt)} />
              )}
              {o.withdrawnAt && (
                <DetailField label="Withdrawn On" value={formatDate(o.withdrawnAt)} />
              )}
            </dl>
          </div>

          {/* Conditions — only for CONDITIONAL */}
          {o.offerType === 'CONDITIONAL' && (
            <div className="py-4 border-b border-border">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-ink mb-3">
                <ListDashesIcon size={15} className="shrink-0" />
                Conditions
              </p>
              {((o.conditions as string[]) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No conditions recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {(o.conditions as string[]).map((cond, idx) => (
                    <li key={idx} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm">
                      <span className="text-amber-600 mt-0.5 shrink-0">•</span>
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Acceptance section */}
          {!isAccepted && !['DECLINED', 'WITHDRAWN'].includes(o.offerType) && (
            <div className="py-4 border-b border-border">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-ink mb-3">
                <CheckSquareIcon size={15} className="shrink-0" />
                Acceptance
              </p>
              <p className="text-sm text-muted-foreground">Status: Pending</p>
            </div>
          )}

          {/* Notes / Reason */}
          <div className="py-4 border-b border-border">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-ink mb-2">
              <TextAlignLeftIcon size={15} className="shrink-0" />
              {o.offerType === 'DECLINED' || o.offerType === 'WITHDRAWN' ? 'Reason / Notes' : 'Decision Notes'}
            </p>
            <p className="text-sm text-muted-foreground">{o.decisionNotes ?? '—'}</p>
          </div>

          {/* Card footer — action buttons */}
          {(canRecord || canAccept) && (
            <div className="flex items-center gap-2 pt-4">
              {canRecord && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setOfferSheetOpen(true)}
                >
                  <PencilSimpleIcon size={13} className="mr-1.5" />
                  {isOfferPresent ? 'Edit Offer Decision' : 'Record Offer Decision'}
                </Button>
              )}
              {canAccept && (
                <Button
                  size="sm"
                  className="rounded-full bg-brand-ink text-white hover:bg-brand-ink/90"
                  onClick={handleAccept}
                  disabled={isPending}
                >
                  Mark as Accepted
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <RecordOfferSheet
        open={offerSheetOpen}
        onOpenChange={setOfferSheetOpen}
        applicantId={applicant.id}
        applicantName={applicant.preferredName ?? applicant.legalName}
        existingOffer={o ?? undefined}
      />
    </div>
  );
}

export function RegistrationTab({ applicant, canEdit }: { applicant: ApplicantFull; canEdit?: boolean }) {
  const { isPending, executeAction } = useActionExecutor();
  const [actionError, setActionError] = useState<string | null>(null);

  const r = applicant.registration;
  const hasAcceptedOffer = !!applicant.offer?.acceptedAt;
  const regReceived = !!applicant.registrationFormReceivedAt;
  const isConfirmed = applicant.status === 'CONFIRMED_ORDINAND';

  const canMarkRegReceived = canEdit && hasAcceptedOffer && !regReceived && !isConfirmed;
  const canConfirmOrdinand = canEdit && regReceived && !isConfirmed;

  const handleMarkRegReceived = () => {
    setActionError(null);
    executeAction({
      action: () => markRegistrationReceived(applicant.id),
      successMessage: 'Registration form marked as received.',
      refresh: true,
      onError: (msg) => setActionError(msg),
    });
  };

  const handleConfirmOrdinand = () => {
    setActionError(null);
    executeAction({
      action: () => confirmOrdinand(applicant.id),
      successMessage: `${applicant.preferredName ?? applicant.legalName} confirmed as ordinand.`,
      refresh: true,
      onError: (msg) => setActionError(msg),
    });
  };

  if (!hasAcceptedOffer && !r) {
    return (
      <EmptyState message="Registration is available once the applicant has accepted their offer." />
    );
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <Alert variant="destructive" className="flex items-center gap-2">
          <WarningCircleIcon size={16} />
          <span className="text-sm">{actionError}</span>
        </Alert>
      )}

      {/* Confirmation banner */}
      {isConfirmed && applicant.confirmedOrdinandAt && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircleIcon size={20} weight="fill" className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Confirmed Ordinand</p>
            <p className="text-xs text-green-700">Confirmed on {formatDate(applicant.confirmedOrdinandAt)}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {(canMarkRegReceived || canConfirmOrdinand) && (
        <div className="flex items-center gap-2">
          {canMarkRegReceived && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleMarkRegReceived}
              disabled={isPending}
            >
              Mark Registration Form Received
            </Button>
          )}
          {canConfirmOrdinand && (
            <Button
              size="sm"
              className="rounded-full bg-brand-ink text-white hover:bg-brand-ink/90"
              onClick={handleConfirmOrdinand}
              disabled={isPending}
            >
              Confirm as Ordinand
            </Button>
          )}
        </div>
      )}

      {/* Registration status checklist */}
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <DetailField
          label="Registration Form Received"
          value={regReceived ? formatDate(applicant.registrationFormReceivedAt!) : null}
        />
        {r && (
          <>
            <DetailField label="Contact Details Confirmed" value={r.contactDetailsConfirmed ? 'Yes' : 'No'} />
            <DetailField label="Programme Confirmed" value={r.programmeConfirmed ? 'Yes' : 'No'} />
            <DetailField label="Bishop Details Confirmed" value={r.bishopDetailsConfirmed ? 'Yes' : 'No'} />
            <DetailField label="Supporting Documents Submitted" value={r.areSupportingDocumentsSubmitted ? 'Yes' : 'No'} />
            <DetailField label="Electronic Signature" value={r.electronicSignature ? 'Yes' : 'No'} />
          </>
        )}
      </dl>
    </div>
  );
}


function DocumentStatusBadge({ status }: { status: 'RECEIVED' | 'WAIVED' | 'OUTSTANDING' }) {
  if (status === 'RECEIVED') {
    return (
      <Badge
        className="border-0 text-xs font-medium"
        style={{ background: '#D1FAE5', color: '#064E3B' }}
      >
        Received
      </Badge>
    );
  }
  if (status === 'WAIVED') {
    return (
      <Badge
        className="border-0 text-xs font-medium line-through"
        style={{ background: '#F9FAFB', color: '#374151' }}
      >
        Waived
      </Badge>
    );
  }
  return (
    <Badge
      className="border-0 text-xs font-medium"
      style={{ background: '#FEF2F2', color: '#991B1B' }}
    >
      Outstanding
    </Badge>
  );
}

interface DocRowActionsProps {
  applicantId: string;
  item: DocumentChecklistItem;
  onUpload: () => void;
  onWaive: () => void;
}

function DocRowActions({ applicantId, item, onUpload, onWaive }: DocRowActionsProps) {
  const { executeAction } = useActionExecutor();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon-sm" className="h-6 w-6 rounded-full" />
      }>
        <DotsThreeIcon size={14} weight="bold" />
        <span className="sr-only">Document actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onUpload}>
          <UploadSimpleIcon size={13} className="mr-2" />
          Mark as Received
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onUpload}>
          <ArrowSquareOutIcon size={13} className="mr-2" />
          Upload File
        </DropdownMenuItem>
        {item.status !== 'WAIVED' && (
          <DropdownMenuItem onClick={onWaive}>
            <ProhibitIcon size={13} className="mr-2" />
            Waive
          </DropdownMenuItem>
        )}
        {item.status !== 'OUTSTANDING' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                executeAction({
                  action: () => clearDocumentStatus({ applicantId, documentTypeId: item.documentTypeId }),
                  successMessage: 'Document status cleared.',
                  refresh: true,
                })
              }
              className="text-destructive focus:text-destructive"
            >
              Clear Status
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DocumentsTab({
  applicant,
  canEdit = false,
  allDocumentTypes = [],
  documentChecklist = [],
}: {
  applicant: ApplicantFull;
  canEdit?: boolean;
  allDocumentTypes?: { id: string; name: string }[];
  documentChecklist?: DocumentChecklistItem[];
}) {
  const [uploadItem, setUploadItem] = useState<DocumentChecklistItem | null>(null);
  const [waiveItem,  setWaiveItem]  = useState<DocumentChecklistItem | null>(null);
  const [copied,     setCopied]     = useState(false);

  const hasSharePointFolder = !!applicant.sharePointFolderUrl;
  const availableDocTypes: DocTypeOption[] = allDocumentTypes;

  const required  = documentChecklist.filter((i) => i.isRequired).length;
  const satisfied = documentChecklist.filter((i) => i.status === 'RECEIVED' || i.status === 'WAIVED').length;
  const pct       = required > 0 ? Math.round((satisfied / required) * 100) : 100;

  function handleCopy() {
    if (!applicant.sharePointFolderUrl) return;
    void navigator.clipboard.writeText(applicant.sharePointFolderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* ── SharePoint folder block ──────────────────────── */}
        <div className="flex flex-col gap-3 rounded-xl border border-black/6 bg-canvas px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FolderOpenIcon size={15} weight="duotone" className="text-brand-ink/60 shrink-0" />
            <span className="font-medium text-brand-ink">SharePoint Folder</span>
          </div>
          <div className="flex items-center gap-2">
            {hasSharePointFolder ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  className="rounded-full h-7 px-3 text-xs gap-1.5"
                  render={
                    <a
                      href={applicant.sharePointFolderUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ArrowSquareOutIcon size={12} weight="bold" />
                  Open applicant folder
                </Button>
                <Tooltip>
                  <TooltipTrigger render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 rounded-full"
                      onClick={handleCopy}
                    />
                  }>
                    {copied
                      ? <PhosphorCheckIcon size={13} weight="bold" className="text-green-600" />
                      : <CopySimpleIcon size={13} />
                    }
                    <span className="sr-only">Copy link</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Not linked</span>
            )}
          </div>
        </div>

        {/* ── Completion progress ──────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-brand-ink">
              Completion: {satisfied} / {required} documents complete
            </span>
            <span className="tabular-nums text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-black/6 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-ink transition-[width] duration-600 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ── Document checklist table ─────────────────────── */}
        <div
          className="max-w-full overflow-hidden rounded-xl border border-black/6 [contain:paint]"
          data-testid="document-checklist"
        >
          <div className="max-w-full overflow-x-auto">
            <table className="w-[720px] max-w-none text-sm">
              <thead>
                <tr className="border-b border-black/6 bg-black/2">
                  <th className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-muted-foreground w-[40%]">
                    Document
                  </th>
                  <th className="py-2.5 px-3 text-center text-xs font-medium text-muted-foreground w-[8%]">
                    Required
                  </th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                    Status
                  </th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground w-[17%]">
                    Received
                  </th>
                  <th className="py-2.5 pl-3 pr-4 text-right text-xs font-medium text-muted-foreground w-[20%]">
                    File
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentChecklist.map((item, idx) => (
                  <tr
                    key={item.documentTypeId}
                    className={`border-b border-black/4 last:border-0 transition-colors hover:bg-black/1.5 ${idx % 2 === 1 ? 'bg-black/1' : ''}`}
                    data-testid="document-row"
                  >
                    {/* Document name */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.isSensitive
                          ? <LockSimpleIcon size={13} weight="bold" className="shrink-0 text-amber-500" />
                          : <FileTextIcon size={13} weight="light" className="shrink-0 text-muted-foreground/60" />
                        }
                        <span className="font-medium text-brand-ink truncate">{item.name}</span>
                        {item.status === 'WAIVED' && item.waiverNote && (
                          <Tooltip>
                            <TooltipTrigger render={<span className="text-muted-foreground cursor-default" />}>
                              <WarningIcon size={12} className="text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-60">
                              {item.waiverNote}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {item.notes && item.status !== 'WAIVED' && (
                        <p className="mt-0.5 pl-5 text-xs text-muted-foreground">{item.notes}</p>
                      )}
                    </td>

                    {/* Required */}
                    <td className="py-3 px-3 text-center">
                      {item.isRequired
                        ? <PhosphorCheckIcon size={14} weight="bold" className="mx-auto text-brand-ink" />
                        : <MinusIcon size={14} className="mx-auto text-muted-foreground/40" />
                      }
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3">
                      <DocumentStatusBadge status={item.status} />
                    </td>

                    {/* Received date */}
                    <td className="py-3 px-3 font-mono text-xs tabular-nums text-muted-foreground">
                      {item.status === 'RECEIVED' && item.receivedAt
                        ? formatDate(item.receivedAt, { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="not-mono">—</span>
                      }
                    </td>

                    {/* File / actions */}
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'RECEIVED' && item.storageUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          className="h-6 px-1.5 text-xs gap-1 text-brand-ink"
                          render={
                              <a href={item.storageUrl} target="_blank" rel="noopener noreferrer" />
                            }
                          >
                            <ArrowSquareOutIcon size={12} weight="bold" />
                            View
                          </Button>
                        )}
                        {canEdit && item.status === 'OUTSTANDING' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 rounded-full text-brand-ink"
                            onClick={() => setUploadItem(item)}
                            aria-label="Add document"
                          >
                            <PlusIcon size={13} weight="bold" />
                          </Button>
                        )}
                        {canEdit && (
                          <DocRowActions
                            applicantId={applicant.id}
                            item={item}
                            onUpload={() => setUploadItem(item)}
                            onWaive={() => setWaiveItem(item)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Dialogs / Sheets ─────────────────────────────── */}
        {uploadItem && (
          <UploadDocumentDialog
            open
            onOpenChange={(open) => { if (!open) setUploadItem(null); }}
            applicantId={applicant.id}
            documentTypeId={uploadItem.documentTypeId}
            documentName={uploadItem.name}
            hasSharePointFolder={hasSharePointFolder}
            availableDocTypes={availableDocTypes}
          />
        )}
        {waiveItem && (
          <WaiveDocumentSheet
            open
            onOpenChange={(open) => { if (!open) setWaiveItem(null); }}
            applicantId={applicant.id}
            documentTypeId={waiveItem.documentTypeId}
            documentName={waiveItem.name}
            isRequired={waiveItem.isRequired}
          />
        )}
      </div>
    </TooltipProvider>
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
