'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarBlankIcon,
  ArrowLeftIcon,
  PaperPlaneTiltIcon,
  FileTextIcon,
  UserCircleIcon,
  CheckCircleIcon,
  NotePencilIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  recordInterviewOutcome,
  saveInterviewNotes,
  markInvitationSent,
  markApplicationReceived,
} from '@/app/(staff)/interviews/actions';
import type { InterviewOutcome, InterviewType, InterviewStatus } from '@/generated/prisma/client';
import { toast } from 'sonner';

interface PanelMember {
  user: { id: string; name: string; email: string; role?: string };
}

interface InterviewDetail {
  id: string;
  interviewType: InterviewType;
  status: InterviewStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
  outcome: InterviewOutcome | null;
  notes: string | null;
  followUpActions: string | null;
  invitationSentAt: Date | null;
  interviewApplicationReceivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  panelMembers: PanelMember[];
  createdBy: { id: string; name: string } | null;
  updatedBy: { id: string; name: string } | null;
  invitationSentBy: { id: string; name: string } | null;
  applicant: {
    id: string;
    applicantId: string;
    legalName: string;
    preferredName: string | null;
    status: string;
    programme?: { courseTitle: string } | null;
    diocese?: { name: string } | null;
    bapStatus?: { stageOneStatus: string } | null;
    ecclesialProfile?: { directorOfOrdinandsName: string | null } | null;
  };
}

interface InterviewDetailViewProps {
  interview: InterviewDetail;
  canRecordOutcome: boolean;
  canEdit: boolean;
  isAcademicStaff: boolean;
}

const OUTCOME_OPTIONS: { value: InterviewOutcome; label: string; color: string }[] = [
  { value: 'RECOMMENDED', label: 'Recommended', color: 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100' },
  { value: 'NOT_RECOMMENDED', label: 'Not Recommended', color: 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100' },
  { value: 'DEFERRED', label: 'Deferred', color: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100' },
];

export function InterviewDetailView({
  interview,
  canRecordOutcome,
  canEdit,
  isAcademicStaff,
}: InterviewDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(interview.notes ?? '');
  const [followUpActions, setFollowUpActions] = useState(interview.followUpActions ?? '');
  const [selectedOutcome, setSelectedOutcome] = useState<InterviewOutcome | null>(
    interview.outcome ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const applicant = interview.applicant;
  const isCompleted = interview.status === 'COMPLETED';

  const handleSaveNotes = () => {
    startTransition(async () => {
      const result = await saveInterviewNotes({
        interviewId: interview.id,
        notes,
        followUpActions,
      });
      if (result.success) {
        toast.success('Notes saved.');
      } else {
        toast.error(result.error ?? 'Failed to save notes.');
      }
    });
  };

  const handleRecordOutcome = () => {
    if (!selectedOutcome) return;
    setError(null);

    startTransition(async () => {
      const result = await recordInterviewOutcome({
        interviewId: interview.id,
        outcome: selectedOutcome,
        notes,
        followUpActions,
      });
      if (result.success) {
        toast.success('Interview outcome recorded.');
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to record outcome.');
      }
    });
  };

  const handleMarkInvitation = () => {
    startTransition(async () => {
      const result = await markInvitationSent(interview.id);
      if (result.success) {
        toast.success('Invitation marked as sent.');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to mark invitation.');
      }
    });
  };

  const handleMarkApplication = () => {
    startTransition(async () => {
      const result = await markApplicationReceived(interview.id);
      if (result.success) {
        toast.success('Application marked as received.');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to mark application.');
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/interviews" className="hover:text-[#1A2744] transition-colors">
          <ArrowLeftIcon size={14} weight="light" className="inline mr-1" />
          Interviews
        </Link>
        <span>/</span>
        <span className="text-[#1A2744] font-medium">
          {interview.interviewType === 'EXPLORATORY_VISIT' ? 'Exploratory Visit' : 'Visit-Interview'}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Interview info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="border-0 bg-[#1A2744] text-white">
                    {interview.interviewType === 'EXPLORATORY_VISIT' ? 'Exploratory Visit' : 'Visit-Interview'}
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
              {/* Date & Time */}
              {interview.scheduledAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarBlankIcon size={16} weight="light" className="text-muted-foreground" />
                  <span className="font-medium">
                    {new Date(interview.scheduledAt).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {' at '}
                    {new Date(interview.scheduledAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* Tracking badges */}
              <div className="flex items-center gap-3 flex-wrap">
                {interview.invitationSentAt ? (
                  <Badge className="border-0 bg-green-100 text-green-800">
                    <PaperPlaneTiltIcon size={12} weight="fill" className="mr-1" />
                    Invitation Sent{' '}
                    {new Date(interview.invitationSentAt).toLocaleDateString('en-GB', {
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
                    onClick={handleMarkInvitation}
                  >
                    <PaperPlaneTiltIcon size={12} weight="light" className="mr-1" />
                    Mark Invitation Sent
                  </Button>
                ) : null}

                {interview.interviewApplicationReceivedAt ? (
                  <Badge className="border-0 bg-green-100 text-green-800">
                    <FileTextIcon size={12} weight="fill" className="mr-1" />
                    Application Received{' '}
                    {new Date(interview.interviewApplicationReceivedAt).toLocaleDateString('en-GB', {
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
                    onClick={handleMarkApplication}
                  >
                    <FileTextIcon size={12} weight="light" className="mr-1" />
                    Mark Application Received
                  </Button>
                ) : null}
              </div>

              {/* Panel members */}
              {interview.panelMembers?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Interview Panel
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {interview.panelMembers.map((pm) => (
                      <div
                        key={pm.user.id}
                        className="flex items-center gap-2 rounded-xl bg-[#F8F7F5] px-3 py-1.5"
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

          {/* Notes & Outcome */}
          <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <NotePencilIcon size={18} weight="light" />
                Interview Notes & Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Notes
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record interview notes here..."
                  className="min-h-30 rounded-xl"
                  disabled={isCompleted && !canEdit}
                />
              </div>

              {/* Follow-up Actions */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Follow-up Actions
                </Label>
                <Textarea
                  value={followUpActions}
                  onChange={(e) => setFollowUpActions(e.target.value)}
                  placeholder="Any follow-up actions required..."
                  className="min-h-20 rounded-xl"
                  disabled={isCompleted && !canEdit}
                />
              </div>

              {/* Save notes button (before outcome is recorded) */}
              {!isCompleted && canRecordOutcome && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleSaveNotes}
                  disabled={isPending}
                >
                  Save Notes
                </Button>
              )}

              {/* Outcome selection */}
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
                        onClick={() => setSelectedOutcome(opt.value)}
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

              {/* Completed outcome display */}
              {isCompleted && interview.outcome && (
                <div className="rounded-xl bg-[#F8F7F5] p-4 space-y-2">
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
                      Completed on {new Date(interview.completedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="rounded-xl text-sm">
                  {error}
                </Alert>
              )}

              {/* Record Outcome button */}
              {!isCompleted && canRecordOutcome && (
                <div className="flex justify-end pt-2">
                  <Button
                    className="rounded-full bg-[#1A2744] hover:bg-[#1A2744]/90 text-white px-6"
                    disabled={!selectedOutcome || isPending}
                    onClick={handleRecordOutcome}
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
        </div>

        {/* Right column — Applicant summary */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Applicant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[#1A2744]">
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
                className="inline-block text-xs font-medium text-[#1A2744] hover:underline mt-2"
              >
                View Full Record →
              </Link>
            </CardContent>
          </Card>

          {/* Created/Updated metadata */}
          <Card className="rounded-2xl border-black/6 shadow-sm shadow-black/3">
            <CardContent className="space-y-2 pt-4 text-xs text-muted-foreground">
              {interview.createdBy && (
                <p>Created by {interview.createdBy.name}</p>
              )}
              <p>
                Created {new Date(interview.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {interview.updatedBy && (
                <p>Last updated by {interview.updatedBy.name}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
