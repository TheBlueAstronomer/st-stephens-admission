'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
} from '@phosphor-icons/react';
import {
  recordInterviewOutcome,
  saveInterviewNotes,
  markInvitationSent,
  markApplicationReceived,
} from '@/app/(staff)/interviews/actions';
import type { InterviewOutcome } from '@/generated/prisma/client';
import {
  ApplicantSummaryCard,
  InterviewHeaderCard,
  InterviewMetadataCard,
  InterviewNotesOutcomeSection,
} from '@/components/interview-detail/sections';
import {
  getInterviewTypeLabel,
  type InterviewDetail,
} from '@/components/interview-detail/shared';
import { useActionExecutor } from '@/hooks/use-action-executor';

interface InterviewDetailViewProps {
  interview: InterviewDetail;
  canRecordOutcome: boolean;
  canEdit: boolean;
  isAcademicStaff: boolean;
}

export function InterviewDetailView({
  interview,
  canRecordOutcome,
  canEdit,
  isAcademicStaff,
}: InterviewDetailViewProps) {
  const { isPending, executeAction } = useActionExecutor();
  const [notes, setNotes] = useState(interview.notes ?? '');
  const [followUpActions, setFollowUpActions] = useState(interview.followUpActions ?? '');
  const [selectedOutcome, setSelectedOutcome] = useState<InterviewOutcome | null>(
    interview.outcome ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSaveNotes = () => {
    executeAction({
      action: () => saveInterviewNotes({
        interviewId: interview.id,
        notes,
        followUpActions,
      }),
      successMessage: 'Notes saved.',
      errorMessage: 'Failed to save notes.',
    });
  };

  const handleRecordOutcome = () => {
    if (!selectedOutcome) return;
    setError(null);

    executeAction({
      action: () => recordInterviewOutcome({
        interviewId: interview.id,
        outcome: selectedOutcome,
        notes,
        followUpActions,
      }),
      successMessage: 'Interview outcome recorded.',
      refresh: true,
      onError: (message) => {
        setError(message || 'Failed to record outcome.');
      },
    });
  };

  const handleMarkInvitation = () => {
    executeAction({
      action: () => markInvitationSent(interview.id),
      successMessage: 'Invitation marked as sent.',
      errorMessage: 'Failed to mark invitation.',
      refresh: true,
    });
  };

  const handleMarkApplication = () => {
    executeAction({
      action: () => markApplicationReceived(interview.id),
      successMessage: 'Application marked as received.',
      errorMessage: 'Failed to mark application.',
      refresh: true,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/interviews" className="hover:text-brand-ink transition-colors">
          <ArrowLeftIcon size={14} weight="light" className="inline mr-1" />
          Interviews
        </Link>
        <span>/</span>
        <span className="text-brand-ink font-medium">
          {getInterviewTypeLabel(interview.interviewType)}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Interview info */}
        <div className="lg:col-span-2 space-y-6">
          <InterviewHeaderCard
            interview={interview}
            canEdit={canEdit}
            isPending={isPending}
            onMarkInvitation={handleMarkInvitation}
            onMarkApplication={handleMarkApplication}
          />

          <InterviewNotesOutcomeSection
            interview={interview}
            canEdit={canEdit}
            canRecordOutcome={canRecordOutcome}
            isPending={isPending}
            notes={notes}
            followUpActions={followUpActions}
            selectedOutcome={selectedOutcome}
            error={error}
            onNotesChange={setNotes}
            onFollowUpActionsChange={setFollowUpActions}
            onSaveNotes={handleSaveNotes}
            onSelectOutcome={setSelectedOutcome}
            onRecordOutcome={handleRecordOutcome}
          />
        </div>

        {/* Right column — Applicant summary */}
        <div className="space-y-6">
          <ApplicantSummaryCard interview={interview} isAcademicStaff={isAcademicStaff} />
          <InterviewMetadataCard interview={interview} />
        </div>
      </div>
    </div>
  );
}
