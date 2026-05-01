'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarBlankIcon,
  WarningIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { scheduleInterview } from '@/app/(staff)/interviews/actions';
import type { BAPStageStatus, InterviewType } from '@/generated/prisma/client';
import { toast } from 'sonner';

interface Interviewer {
  id: string;
  name: string;
  email: string;
}

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId: string;
  applicantName: string;
  applicantDisplayId: string;
  bapStageOneStatus: BAPStageStatus | null;
  hasStageOneBAPException: boolean;
  availableInterviewers: Interviewer[];
}

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  applicantId,
  applicantName,
  applicantDisplayId,
  bapStageOneStatus,
  hasStageOneBAPException,
  availableInterviewers,
}: ScheduleInterviewDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedInterviewers, setSelectedInterviewers] = useState<Interviewer[]>([]);
  const [showInterviewerSearch, setShowInterviewerSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bapBlocked =
    bapStageOneStatus !== 'COMPLETED' &&
    bapStageOneStatus !== 'SCHEDULED' &&
    !hasStageOneBAPException;

  const canSubmit =
    !bapBlocked &&
    interviewType !== null &&
    scheduledDate !== '' &&
    scheduledTime !== '' &&
    selectedInterviewers.length > 0;

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

    startTransition(async () => {
      const result = await scheduleInterview({
        applicantId,
        interviewType,
        scheduledAt,
        interviewerIds: selectedInterviewers.map((i) => i.id),
      });

      if (!result.success) {
        setError(result.error ?? 'Failed to schedule interview.');
      } else {
        toast.success(
          `Interview scheduled for ${new Date(scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        );
        onOpenChange(false);
        resetForm();
        router.refresh();
      }
    });
  };

  const resetForm = () => {
    setInterviewType(null);
    setScheduledDate('');
    setScheduledTime('');
    setSelectedInterviewers([]);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130 rounded-[2rem] p-0 overflow-hidden">
        {/* Double-Bezel shell */}
        <div className="p-1">
          <div className="rounded-[1.75rem] border border-black/6 bg-white p-6 space-y-5">
            <DialogHeader>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Interview Management
              </span>
              <DialogTitle className="text-xl font-semibold text-[#1A2744]">
                Schedule Interview
              </DialogTitle>
              <DialogDescription className="sr-only">
                Schedule an interview for this applicant
              </DialogDescription>
            </DialogHeader>

            {/* Applicant info */}
            <div className="flex items-center gap-3 rounded-xl bg-[#F8F7F5] p-3">
              <div>
                <p className="text-sm font-medium text-[#1A2744]">{applicantName}</p>
                <p className="text-xs text-muted-foreground font-mono">{applicantDisplayId}</p>
              </div>
              {bapStageOneStatus && (
                <Badge
                  className={`ml-auto border-0 text-xs ${
                    bapStageOneStatus === 'COMPLETED' || bapStageOneStatus === 'SCHEDULED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  BAP: {bapStageOneStatus}
                </Badge>
              )}
            </div>

            {/* BAP Warning */}
            {bapBlocked && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-800 rounded-xl">
                <WarningIcon size={16} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
                <div className="ml-2 text-sm">
                  Stage 1 BAP incomplete. An exception must be on record before scheduling.
                </div>
              </Alert>
            )}

            {/* Interview Type */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Interview Type *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(['EXPLORATORY_VISIT', 'VISIT_INTERVIEW'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInterviewType(type)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      interviewType === type
                        ? 'border-[#1A2744] bg-[#1A2744] text-white shadow-sm'
                        : 'border-black/8 bg-white text-[#1A2744] hover:border-[#1A2744]/30'
                    }`}
                  >
                    {type === 'EXPLORATORY_VISIT' ? 'Exploratory Visit' : 'Visit-Interview'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Date & Time *
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <CalendarBlankIcon size={16} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-30 rounded-xl"
                />
              </div>
            </div>

            {/* Assigned Interviewer(s) */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Assigned Interviewer *
              </Label>

              {/* Selected interviewers */}
              {selectedInterviewers.map((interviewer) => (
                <div
                  key={interviewer.id}
                  className="flex items-center justify-between rounded-xl bg-[#F8F7F5] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A2744]">{interviewer.name}</p>
                    <p className="text-xs text-muted-foreground">{interviewer.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterviewer(interviewer.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              ))}

              {/* Interviewer search combobox */}
              {showInterviewerSearch ? (
                <Command className="rounded-xl border border-black/8">
                  <CommandInput placeholder="Search academic staff..." />
                  <CommandList>
                    <CommandEmpty>No staff found.</CommandEmpty>
                    <CommandGroup>
                      {availableInterviewers
                        .filter((i) => !selectedInterviewers.find((s) => s.id === i.id))
                        .map((interviewer) => (
                          <CommandItem
                            key={interviewer.id}
                            onSelect={() => handleAddInterviewer(interviewer)}
                          >
                            <div>
                              <p className="text-sm font-medium">{interviewer.name}</p>
                              <p className="text-xs text-muted-foreground">{interviewer.email}</p>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInterviewerSearch(true)}
                  className="text-sm text-muted-foreground hover:text-[#1A2744]"
                >
                  <PlusIcon size={14} className="mr-1" />
                  Add panel member
                </Button>
              )}
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="rounded-xl text-sm">
                {error}
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose
                render={
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={resetForm}
                  />
                }
              >
                Cancel
              </DialogClose>
              <Button
                className="rounded-full bg-[#1A2744] hover:bg-[#1A2744]/90 text-white px-6"
                disabled={!canSubmit || isPending || bapBlocked}
                onClick={handleSubmit}
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Scheduling…
                  </>
                ) : (
                  'Schedule →'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
