'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  recordInterviewOutcome,
  saveInterviewNotes,
  markInvitationSent,
  markApplicationReceived,
} from '@/features/interviews/actions/interview-actions';
import type { InterviewOutcome } from '@/generated/prisma/client';
import {
  ApplicantSummaryCard,
  InterviewLeftMeta,
  InterviewWorkingArea,
} from '@/features/interviews/components/detail/sections';
import type { InterviewDetail } from '@/features/interviews/components/detail/shared';
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

  const applicantName =
    interview.applicant.preferredName ?? interview.applicant.legalName ?? 'Applicant';

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/applicants" />}>Applicants</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/applicants/${interview.applicant.id}`} />}>{applicantName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Interview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two-column layout: narrow left meta + flex-1 right content */}
      <div className="flex gap-8 items-start">
        {/* Left column — Interview meta (~220px) */}
        <div className="w-52 shrink-0">
          <InterviewLeftMeta
            interview={interview}
            canEdit={canEdit}
            isPending={isPending}
            onMarkInvitationAction={handleMarkInvitation}
            onMarkApplicationAction={handleMarkApplication}
          />
        </div>

        {/* Right column — Applicant summary + working area */}
        <div className="flex-1 min-w-0 space-y-6">
          <ApplicantSummaryCard interview={interview} isAcademicStaff={isAcademicStaff} />

          <InterviewWorkingArea
            interview={interview}
            canEdit={canEdit}
            canRecordOutcome={canRecordOutcome}
            isPending={isPending}
            notes={notes}
            followUpActions={followUpActions}
            selectedOutcome={selectedOutcome}
            error={error}
            onNotesChangeAction={setNotes}
            onFollowUpActionsChangeAction={setFollowUpActions}
            onSaveNotesAction={handleSaveNotes}
            onSelectOutcomeAction={setSelectedOutcome}
            onRecordOutcomeAction={handleRecordOutcome}
          />
        </div>
      </div>
    </div>
  );
}
