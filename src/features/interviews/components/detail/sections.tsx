'use client';

import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileTextIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getInterviewTypeLabel, OUTCOME_OPTIONS, type InterviewDetail } from '@/features/interviews/components/detail/shared';
import type { InterviewOutcome } from '@/generated/prisma/client';
import { formatDate, formatTime } from '@/lib/formatters/date';

/** Left narrow meta column — type badge, status, date/time, panel, invitation, application */
export function InterviewLeftMeta({
  interview,
  canEdit,
  isPending,
  onMarkInvitationAction,
  onMarkApplicationAction,
}: {
  interview: InterviewDetail;
  canEdit: boolean;
  isPending: boolean;
  onMarkInvitationAction: () => void;
  onMarkApplicationAction: () => void;
}) {
  const statusDotColor =
    interview.status === 'COMPLETED'
      ? 'bg-success'
      : interview.status === 'SCHEDULED'
        ? 'bg-brand-solid'
        : interview.status === 'CANCELLED'
          ? 'bg-destructive'
          : 'bg-muted-foreground';

  return (
    <div className="space-y-8">
      {/* Type + status */}
      <div className="space-y-2">
        <span className="inline-block rounded-md bg-brand-solid px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-solid-foreground">
          {getInterviewTypeLabel(interview.interviewType)}
        </span>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusDotColor}`} />
          <span className={`text-sm font-semibold ${
            interview.status === 'SCHEDULED' ? 'text-success' :
            interview.status === 'COMPLETED' ? 'text-success' :
            interview.status === 'CANCELLED' ? 'text-destructive' :
            'text-muted-foreground'
          }`}>{interview.status}</span>
        </div>
      </div>

      {/* Date & Time */}
      {interview.scheduledAt && (
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Date &amp; Time
          </p>
          <p className="text-sm font-medium text-brand-ink">
            {formatDate(interview.scheduledAt, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <p className="text-sm text-brand-solid font-medium">
            {formatTime(interview.scheduledAt, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Assigned To */}
      {interview.panelMembers?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Assigned To
          </p>
          <div className="space-y-2">
            {interview.panelMembers.map((pm) => {
              const initials = (pm.user.name ?? '')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              return (
                <div key={pm.user.id} className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-brand-solid flex items-center justify-center text-[10px] font-semibold text-brand-solid-foreground shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm text-brand-ink">{pm.user.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-border" />

      {/* Invitation */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Invitation
        </p>
        {interview.invitationSentAt ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm text-on-primary-container">
              <CheckCircleIcon size={14} weight="fill" />
              <span>
                Sent{' '}
                {formatDate(interview.invitationSentAt, { day: 'numeric', month: 'short' })}
                {' · '}
                {formatTime(interview.invitationSentAt, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {interview.invitationSentBy && (
              <p className="text-xs text-muted-foreground pl-5">
                by {interview.invitationSentBy.name}
              </p>
            )}
          </div>
        ) : canEdit && interview.status === 'SCHEDULED' ? (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-ink transition-colors disabled:opacity-50"
            disabled={isPending}
            onClick={onMarkInvitationAction}
          >
            <PaperPlaneTiltIcon size={14} weight="light" />
            Mark as sent
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>

      {/* Application */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Application
        </p>
        {interview.interviewApplicationReceivedAt ? (
          <div className="flex items-center gap-1.5 text-sm text-on-primary-container">
            <CheckCircleIcon size={14} weight="fill" />
            <span>
              Received{' '}
              {formatDate(interview.interviewApplicationReceivedAt, { day: 'numeric', month: 'short' })}
              {' · '}
              {formatTime(interview.interviewApplicationReceivedAt, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ) : canEdit && interview.status === 'SCHEDULED' ? (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-ink transition-colors disabled:opacity-50"
            disabled={isPending}
            onClick={onMarkApplicationAction}
          >
            <FileTextIcon size={14} weight="light" />
            Mark as received
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}

/** Horizontal applicant summary card — spans full right column width */
export function ApplicantSummaryCard({
  interview,
  isAcademicStaff,
}: {
  interview: InterviewDetail;
  isAcademicStaff: boolean;
}) {
  const applicant = interview.applicant;

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm p-5">
      <h2 className="text-base font-semibold text-brand-ink mb-4">Applicant Summary</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Name */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            Name
          </p>
          <Link
            href={`/applicants/${applicant.id}`}
            className="text-sm font-semibold text-brand-ink hover:underline"
          >
            {applicant.preferredName ?? applicant.legalName}
          </Link>
          <p className="text-[11px] text-muted-foreground font-mono">{applicant.applicantId}</p>
        </div>

        {/* Diocese */}
        {applicant.diocese && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Diocese
            </p>
            <p className="text-sm font-medium text-brand-ink">{applicant.diocese.name}</p>
          </div>
        )}

        {/* Programme */}
        {applicant.programme && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Programme
            </p>
            <p className="text-sm font-medium text-brand-ink">{applicant.programme.courseTitle}</p>
          </div>
        )}

        {/* BAP Status */}
        {applicant.bapStatus && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              BAP Status
            </p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
              <CheckCircleIcon size={14} weight="fill" className="text-success shrink-0" />
              {applicant.bapStatus.stageOneStatus}
            </div>
          </div>
        )}

        {/* DDO — hidden from academic staff */}
        {!isAcademicStaff && applicant.ecclesialProfile?.directorOfOrdinandsName && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              DDO
            </p>
            <p className="text-sm font-medium text-brand-ink">
              {applicant.ecclesialProfile.directorOfOrdinandsName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Right working area — notes, outcome, follow-up, action buttons */
export function InterviewWorkingArea({
  interview,
  canEdit,
  canRecordOutcome,
  isPending,
  notes,
  followUpActions,
  selectedOutcome,
  error,
  onNotesChangeAction,
  onFollowUpActionsChangeAction,
  onSaveNotesAction,
  onSelectOutcomeAction,
  onRecordOutcomeAction,
}: {
  interview: InterviewDetail;
  canEdit: boolean;
  canRecordOutcome: boolean;
  isPending: boolean;
  notes: string;
  followUpActions: string;
  selectedOutcome: InterviewOutcome | null;
  error: string | null;
  onNotesChangeAction: (value: string) => void;
  onFollowUpActionsChangeAction: (value: string) => void;
  onSaveNotesAction: () => void;
  onSelectOutcomeAction: (outcome: InterviewOutcome) => void;
  onRecordOutcomeAction: () => void;
}) {
  const isCompleted = interview.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* Notes */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-brand-ink">Notes</h3>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChangeAction(e.target.value)}
          placeholder="Enter interview notes..."
          className="min-h-50 rounded-2xl border border-border bg-background focus-visible:ring-1 focus-visible:ring-brand-solid/30 resize-none"
          disabled={isCompleted && !canEdit}
        />
      </div>

      {/* Outcome */}
      {!isCompleted && canRecordOutcome && (
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-semibold text-brand-ink">Outcome</h3>
          <div className="flex flex-wrap gap-3">
            {OUTCOME_OPTIONS.map((opt) => {
              const isSelected = selectedOutcome === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectOutcomeAction(opt.value)}
                  className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-brand-solid bg-brand-solid text-brand-solid-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-brand-solid/40'
                  }`}
                >
                  <span className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-white bg-white' : 'border-border'
                  }`}>
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-brand-solid" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isCompleted && interview.outcome && (
        <div className="rounded-2xl border border-border bg-surface-subtle p-4 space-y-1 mt-2">
          <p className="text-sm font-semibold text-brand-ink">
            Outcome:{' '}
            <span
              className={
                interview.outcome === 'RECOMMENDED'
                  ? 'text-on-primary-container'
                  : interview.outcome === 'NOT_RECOMMENDED'
                    ? 'text-destructive'
                    : 'text-accent-gold'
              }
            >
              {interview.outcome.replace(/_/g, ' ')}
            </span>
          </p>
          {interview.completedAt && (
            <p className="text-xs text-muted-foreground">
              Completed{' '}
              {formatDate(interview.completedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Follow-up actions */}
      <div className="space-y-2 pt-2">
        <h3 className="text-base font-semibold text-brand-ink">Follow-up actions</h3>
        <Textarea
          value={followUpActions}
          onChange={(e) => onFollowUpActionsChangeAction(e.target.value)}
          placeholder="Optional follow-up steps..."
          className="rounded-2xl border border-border bg-background focus-visible:ring-1 focus-visible:ring-brand-solid/30 resize-none"
          rows={3}
          disabled={isCompleted && !canEdit}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl text-sm">
          {error}
        </Alert>
      )}

      {/* Action buttons */}
      {canRecordOutcome && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={onSaveNotesAction}
            disabled={isPending || isCompleted}
          >
            Save Notes
          </Button>

          {!isCompleted && (
            <Button
              className="rounded-full bg-brand-ink px-6 text-white hover:bg-brand-ink/90"
              disabled={!selectedOutcome || isPending}
              onClick={onRecordOutcomeAction}
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Recording…
                </>
              ) : (
                <>
                  Mark as Completed
                  <ArrowRightIcon size={16} weight="bold" className="ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
