'use client';

import Link from 'next/link';
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  FileTextIcon,
  NotePencilIcon,
  PaperPlaneTiltIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getInterviewTypeLabel, OUTCOME_OPTIONS, type InterviewDetail } from '@/components/interview-detail/shared';
import type { InterviewOutcome } from '@/generated/prisma/client';
import { formatDate, formatDateTime } from '@/lib/formatters/date';

export function InterviewHeaderCard({
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
  return (
    <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="border-0 bg-brand-solid text-brand-solid-foreground">
              {getInterviewTypeLabel(interview.interviewType)}
            </Badge>
            <Badge
              variant="outline"
              className={`${
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {interview.scheduledAt && (
          <div className="flex items-center gap-2 text-sm">
            <CalendarBlankIcon size={16} weight="light" className="text-muted-foreground" />
            <span className="font-medium">
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
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {interview.invitationSentAt ? (
            <Badge className="border-0 bg-green-100 text-green-800">
              <PaperPlaneTiltIcon size={12} weight="fill" className="mr-1" />
              Invitation Sent{' '}
              {formatDate(interview.invitationSentAt, {
                day: 'numeric',
                month: 'short',
              })}
            </Badge>
          ) : canEdit && interview.status === 'SCHEDULED' ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              disabled={isPending}
              onClick={onMarkInvitationAction}
            >
              <PaperPlaneTiltIcon size={12} weight="light" className="mr-1" />
              Mark Invitation Sent
            </Button>
          ) : null}

          {interview.interviewApplicationReceivedAt ? (
            <Badge className="border-0 bg-green-100 text-green-800">
              <FileTextIcon size={12} weight="fill" className="mr-1" />
              Application Received{' '}
              {formatDate(interview.interviewApplicationReceivedAt, {
                day: 'numeric',
                month: 'short',
              })}
            </Badge>
          ) : canEdit && interview.status === 'SCHEDULED' ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              disabled={isPending}
              onClick={onMarkApplicationAction}
            >
              <FileTextIcon size={12} weight="light" className="mr-1" />
              Mark Application Received
            </Button>
          ) : null}
        </div>

        {interview.panelMembers?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Interview Panel
            </h4>
            <div className="flex flex-wrap gap-2">
              {interview.panelMembers.map((pm) => (
                <div
                  key={pm.user.id}
                  className="flex items-center gap-2 rounded-xl bg-surface-subtle px-3 py-1.5"
                >
                  <UserCircleIcon size={16} weight="light" className="text-muted-foreground" />
                  <span className="text-sm font-medium">{pm.user.name}</span>
                  <span className="text-xs text-muted-foreground">{pm.user.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InterviewNotesOutcomeSection({
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
    <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <NotePencilIcon size={18} weight="light" />
          Interview Notes & Outcome
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Notes
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChangeAction(e.target.value)}
            placeholder="Record interview notes here..."
            className="min-h-30 rounded-xl"
            disabled={isCompleted && !canEdit}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Follow-up Actions
          </Label>
          <Textarea
            value={followUpActions}
            onChange={(e) => onFollowUpActionsChangeAction(e.target.value)}
            placeholder="Any follow-up actions required..."
            className="min-h-20 rounded-xl"
            disabled={isCompleted && !canEdit}
          />
        </div>

        {!isCompleted && canRecordOutcome && (
          <Button
            variant="outline"
            className="rounded-full"
            onClick={onSaveNotesAction}
            disabled={isPending}
          >
            Save Notes
          </Button>
        )}

        {!isCompleted && canRecordOutcome && (
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Record Outcome *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectOutcomeAction(opt.value)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedOutcome === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ring-current'
                      : 'border-black/8 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {selectedOutcome === opt.value && (
                    <CheckCircleIcon size={14} weight="fill" className="inline mr-1.5" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isCompleted && interview.outcome && (
          <div className="rounded-xl bg-surface-subtle p-4 space-y-2">
            <p className="text-sm font-medium">
              Outcome:{' '}
              <span
                className={
                  interview.outcome === 'RECOMMENDED'
                    ? 'text-green-700'
                    : interview.outcome === 'NOT_RECOMMENDED'
                      ? 'text-red-700'
                      : 'text-amber-700'
                }
              >
                {interview.outcome.replace('_', ' ')}
              </span>
            </p>
            {interview.completedAt && (
              <p className="text-xs text-muted-foreground">
                Completed on {formatDate(interview.completedAt, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-xl text-sm">
            {error}
          </Alert>
        )}

        {!isCompleted && canRecordOutcome && (
          <div className="flex justify-end pt-2">
            <Button
              className="rounded-full bg-brand-solid px-6 text-brand-solid-foreground hover:bg-brand-solid/90"
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
                  <CheckCircleIcon size={16} weight="fill" className="mr-2" />
                  Record Outcome
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ApplicantSummaryCard({
  interview,
  isAcademicStaff,
}: {
  interview: InterviewDetail;
  isAcademicStaff: boolean;
}) {
  const applicant = interview.applicant;

  return (
    <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Applicant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-brand-ink">
            {applicant.preferredName ?? applicant.legalName}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {applicant.applicantId}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          {applicant.programme && (
            <div>
              <span className="text-xs text-muted-foreground">Programme</span>
              <p className="font-medium">{applicant.programme.courseTitle}</p>
            </div>
          )}
          {applicant.diocese && (
            <div>
              <span className="text-xs text-muted-foreground">Diocese</span>
              <p className="font-medium">{applicant.diocese.name}</p>
            </div>
          )}
          {applicant.bapStatus && (
            <div>
              <span className="text-xs text-muted-foreground">BAP Stage 1</span>
              <p className="font-medium">{applicant.bapStatus.stageOneStatus}</p>
            </div>
          )}
          {!isAcademicStaff && applicant.ecclesialProfile?.directorOfOrdinandsName && (
            <div>
              <span className="text-xs text-muted-foreground">Director of Ordinands</span>
              <p className="font-medium">{applicant.ecclesialProfile.directorOfOrdinandsName}</p>
            </div>
          )}
        </div>

        <Link
          href={`/applicants/${applicant.id}`}
          className="mt-2 inline-block text-xs font-medium text-brand-ink hover:underline"
        >
          View Full Record →
        </Link>
      </CardContent>
    </Card>
  );
}

export function InterviewMetadataCard({ interview }: { interview: InterviewDetail }) {
  return (
    <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
      <CardContent className="space-y-2 pt-4 text-xs text-muted-foreground">
        {interview.createdBy && <p>Created by {interview.createdBy.name}</p>}
        <p>
          Created {formatDate(interview.createdAt, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        {interview.updatedBy && <p>Last updated by {interview.updatedBy.name}</p>}
      </CardContent>
    </Card>
  );
}
