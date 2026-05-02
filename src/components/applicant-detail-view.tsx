'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  CircleIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { STATUS_LABELS } from '@/lib/constants/applicant-status';
import { VALID_TRANSITIONS } from '@/lib/business-rules/status-transitions';
import { updateApplicantStatus } from '@/app/(staff)/applicants/actions';
import type { ApplicantStatus } from '@/generated/prisma/client';
import type { ApplicantFull, AvailableInterviewer } from '@/components/applicant-detail/shared';
import { useActionExecutor } from '@/hooks/use-action-executor';
import { getApplicantProgressStages } from '@/lib/view-models/applicant-progress';
import {
  BAPTab,
  DocumentsTab,
  EcclesialTab,
  InterviewTab,
  NotesTab,
  OfferTab,
  PersonalTab,
  RegistrationTab,
  TimelineTab,
} from '@/components/applicant-detail/tabs';

interface ApplicantDetailViewProps {
  applicant: ApplicantFull;
  canEdit: boolean;
  availableInterviewers?: AvailableInterviewer[];
}

export function ApplicantDetailView({ applicant, canEdit, availableInterviewers = [] }: ApplicantDetailViewProps) {
  const [activeTab, setActiveTab] = useState<string>('personal');
  const { isPending, executeAction } = useActionExecutor();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatusTarget, setPendingStatusTarget] = useState<ApplicantStatus | null>(null);

  const initials = applicant.legalName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const nextStatuses = VALID_TRANSITIONS[applicant.status] ?? [];
  const progressStages = getApplicantProgressStages(applicant.status);

  const handleAdvanceStatus = async (targetStatus: ApplicantStatus) => {
    setStatusError(null);

    executeAction({
      action: () => updateApplicantStatus(applicant.id, targetStatus),
      refresh: true,
      onSuccess: () => {
        setPendingStatusTarget(null);
      },
      onError: (message) => {
        setPendingStatusTarget(null);
        setStatusError(message || 'Failed to update status.');
      },
    });
  };

  const handleConfirmAdvanceStatus = () => {
    if (!pendingStatusTarget) {
      return;
    }

    void handleAdvanceStatus(pendingStatusTarget);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/applicants" className="hover:text-brand-ink transition-colors">
          Applicants
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-brand-ink font-medium">{applicant.legalName}</span>
      </nav>

      <div className="flex gap-6">
        {/* Left column — dark navy sidebar panel */}
        <div className="w-70 shrink-0 sticky top-6 self-start space-y-0 overflow-hidden rounded-2xl bg-brand-solid text-brand-solid-foreground shadow-lg shadow-brand-solid/20">
          {/* Avatar and identity */}
          <div className="p-6 space-y-4">
            <Avatar className="h-16 w-16 mx-auto ring-2 ring-white/20">
              <AvatarFallback className="text-lg bg-white/15 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">{applicant.legalName}</h2>
              <p className="text-sm text-white/50 font-mono">{applicant.applicantId}</p>
            </div>
            <div className="flex justify-center">
              <StatusBadge status={applicant.status} size="lg" />
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Progress stepper — with connecting lines */}
          <div className="px-6 py-5 space-y-0">
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/40 mb-3 block">
              Journey
            </span>
            {progressStages.map((stage) => {
              return (
                <div key={stage.status} className="flex items-stretch gap-3">
                  {/* Icon + connecting line */}
                  <div className="flex flex-col items-center">
                    {stage.isCompleted ? (
                      <CheckCircleIcon size={18} weight="fill" className="text-emerald-400 shrink-0" />
                    ) : stage.isCurrent ? (
                      <div className="h-4.5 w-4.5 rounded-full border-2 border-white bg-white/20 shrink-0" />
                    ) : (
                      <CircleIcon size={18} weight="light" className="text-white/25 shrink-0" />
                    )}
                    {!stage.isLast && (
                      <div className={`w-px flex-1 my-1 ${stage.isCompleted ? 'bg-emerald-400/40' : 'bg-white/10'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-sm pb-3 ${
                      stage.isCurrent
                        ? 'font-semibold text-white'
                        : stage.isCompleted
                          ? 'text-emerald-400/80'
                          : 'text-white/30'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          {canEdit && nextStatuses.length > 0 && (
            <>
              <div className="border-t border-white/10" />
              <div className="px-6 py-4 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
                  Quick Actions
                </span>
                {statusError && (
                  <Alert variant="destructive" className="text-xs rounded-lg">
                    {statusError}
                  </Alert>
                )}
                {nextStatuses.map((target) => (
                  <Button
                    key={target}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-sm border-white/15 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/25 rounded-xl"
                    disabled={isPending}
                    onClick={() => setPendingStatusTarget(target)}
                  >
                    <ArrowRightIcon size={14} weight="light" className="mr-2" />
                    {STATUS_LABELS[target]}
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* Admissions Year */}
          {applicant.admissionsYear && (
            <>
              <div className="border-t border-white/10" />
              <div className="px-6 py-4">
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
                  Admissions Year
                </span>
                <p className="mt-1 text-sm font-medium text-white">
                  {applicant.admissionsYear.label}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="gap-6">
            <TabsList className="overflow-x-auto rounded-xl">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="ecclesial">Ecclesial</TabsTrigger>
              <TabsTrigger value="bap">BAP</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
              <TabsTrigger value="offer">Offer</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-sm shadow-black/3">
              <TabsContent value="personal"><PersonalTab applicant={applicant} /></TabsContent>
              <TabsContent value="ecclesial"><EcclesialTab applicant={applicant} /></TabsContent>
              <TabsContent value="bap"><BAPTab applicant={applicant} /></TabsContent>
              <TabsContent value="interview"><InterviewTab applicant={applicant} canEdit={canEdit} availableInterviewers={availableInterviewers} /></TabsContent>
              <TabsContent value="offer"><OfferTab applicant={applicant} /></TabsContent>
              <TabsContent value="registration"><RegistrationTab applicant={applicant} /></TabsContent>
              <TabsContent value="documents"><DocumentsTab applicant={applicant} /></TabsContent>
              <TabsContent value="notes"><NotesTab /></TabsContent>
              <TabsContent value="timeline"><TimelineTab applicant={applicant} /></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <ConfirmationDialog
        open={pendingStatusTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatusTarget(null);
          }
        }}
        title="Advance applicant status?"
        description={pendingStatusTarget ? `Are you sure you want to advance to "${STATUS_LABELS[pendingStatusTarget]}"?` : ''}
        confirmLabel="Advance Status"
        onConfirm={handleConfirmAdvanceStatus}
        isPending={isPending}
      />
    </div>
  );
}
