'use client';

import { useState } from 'react';
import { scheduleInterview } from '@/app/(staff)/interviews/actions';
import type { InterviewType } from '@/generated/prisma/client';
import { useActionExecutor } from '@/hooks/use-action-executor';
import { formatDate } from '@/lib/formatters/date';

interface Interviewer {
  id: string;
  name: string;
  email: string;
}

export function useScheduleInterviewDialog({
  applicantId,
  applicantName,
  onOpenChange,
  bapBlocked,
}: {
  applicantId: string;
  applicantName: string;
  onOpenChange: (open: boolean) => void;
  bapBlocked: boolean;
}) {
  const { isPending, executeAction } = useActionExecutor();
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedInterviewers, setSelectedInterviewers] = useState<Interviewer[]>([]);
  const [showInterviewerSearch, setShowInterviewerSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !bapBlocked &&
    interviewType !== null &&
    scheduledDate !== '' &&
    scheduledTime !== '' &&
    selectedInterviewers.length > 0;

  const resetForm = () => {
    setInterviewType(null);
    setScheduledDate('');
    setScheduledTime('');
    setSelectedInterviewers([]);
    setError(null);
    setShowInterviewerSearch(false);
  };

  const handleAddInterviewer = (interviewer: Interviewer) => {
    if (!selectedInterviewers.find((i) => i.id === interviewer.id)) {
      setSelectedInterviewers([...selectedInterviewers, interviewer]);
    }
    setShowInterviewerSearch(false);
  };

  const handleRemoveInterviewer = (id: string) => {
    setSelectedInterviewers(selectedInterviewers.filter((i) => i.id !== id));
  };

  const handleSubmit = () => {
    if (!canSubmit || !interviewType) return;
    setError(null);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    executeAction({
      action: () => scheduleInterview({
        applicantId,
        interviewType,
        scheduledAt,
        interviewerIds: selectedInterviewers.map((i) => i.id),
      }),
      successMessage: () =>
        `Interview scheduled for ${applicantName} on ${formatDate(scheduledAt, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`,
      refresh: true,
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
      onError: (message) => {
        setError(message || 'Failed to schedule interview.');
      },
    });
  };

  return {
    isPending,
    interviewType,
    setInterviewType,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    selectedInterviewers,
    showInterviewerSearch,
    setShowInterviewerSearch,
    error,
    canSubmit,
    resetForm,
    handleAddInterviewer,
    handleRemoveInterviewer,
    handleSubmit,
  };
}
