'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  ArrowRightIcon,
  FolderSimpleIcon,
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
import type { DocumentChecklistItem } from '@/lib/queries/documents';
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
  allDocumentTypes?: { id: string; name: string }[];
  documentChecklist?: DocumentChecklistItem[];
}

export function ApplicantDetailView({ applicant, canEdit, availableInterviewers = [], allDocumentTypes = [], documentChecklist = [] }: ApplicantDetailViewProps) {
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
  const progressStages = getApplicantProgressStages(applicant.status, applicant.auditLogs);

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
        {/* Left column — light panel */}
        <div className="w-64 shrink-0 sticky top-6 self-start overflow-hidden rounded-2xl">
          {/* Avatar and identity */}
          <div className="p-6 space-y-4">
            <Avatar className="h-16 w-16 mx-auto">
              <AvatarFallback className="text-lg bg-brand-ink text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-base font-semibold text-brand-ink">{applicant.legalName}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{applicant.applicantId}</p>
            </div>
            <div className="flex justify-center">
              <StatusBadge status={applicant.status} size="lg" />
            </div>
            {/* Info badges — programme, diocese, admissions year */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {applicant.programme && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {applicant.programme.courseTitle}
                </span>
              )}
              {applicant.diocese && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {applicant.diocese.name}
                </span>
              )}
              {applicant.admissionsYear && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {applicant.admissionsYear.label}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Progress stepper — with connecting lines */}
          <div className="px-6 py-5 space-y-0">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3 block">
              Journey
            </span>
            {progressStages.map((stage) => {
              return (
                <div key={stage.status} className="flex items-stretch gap-3">
                  {/* Icon + connecting line */}
                  <div className="flex flex-col items-center">
                    {stage.isCompleted && !stage.isCurrent ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-brand-ink flex items-center justify-center shrink-0">
                        <CheckIcon size={10} weight="bold" className="text-white" />
                      </div>
                    ) : stage.isCurrent ? (
                      <div className="h-[18px] w-[18px] rounded-full border-2 border-brand-ink flex items-center justify-center shrink-0">
                        <div className="h-[6px] w-[6px] rounded-full bg-brand-ink" />
                      </div>
                    ) : (
                      <div className="h-[18px] w-[18px] rounded-full border-2 border-border shrink-0" />
                    )}
                    {!stage.isLast && (
                      <div className={`w-px flex-1 my-0.5 ${stage.isCompleted && !stage.isCurrent ? 'bg-brand-ink/30' : 'bg-border'}`} />
                    )}
                  </div>
                  {/* Label + sub-label */}
                  <div className="pb-3">
                    <span
                      className={`text-sm block ${
                        stage.isCurrent
                          ? 'font-semibold text-brand-ink'
                          : stage.isCompleted
                            ? 'text-brand-ink'
                            : 'text-muted-foreground/40'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {stage.isCurrent && (
                      <span className="text-[11px] text-muted-foreground">In Progress</span>
                    )}
                    {stage.isCompleted && !stage.isCurrent && stage.completedAt && (
                      <span className="text-[11px] text-muted-foreground">
                        Completed {stage.completedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* OneDrive Folder link */}
          <div className="border-t border-border" />
          <div className="px-6 py-3">
            <a
              href="#"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-brand-ink transition-colors"
            >
              <FolderSimpleIcon size={14} weight="light" className="shrink-0" />
              OneDrive Folder
            </a>
          </div>

          {/* Quick Actions */}
          {canEdit && nextStatuses.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="px-6 py-4 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
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
                    className="w-full justify-start text-sm rounded-xl"
                    disabled={isPending}
                    onClick={() => setPendingStatusTarget(target)}
                  >
                    <ArrowRightIcon size={14} weight="light" className="mr-2 shrink-0" />
                    {STATUS_LABELS[target]}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="gap-4">
            <div className="overflow-x-auto">
              <TabsList variant="line" className="w-max min-w-full flex gap-0 rounded-none bg-transparent px-0 h-auto pb-0">
                <TabsTrigger value="personal" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Personal</TabsTrigger>
                <TabsTrigger value="ecclesial" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Ecclesial</TabsTrigger>
                <TabsTrigger value="bap" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">BAP</TabsTrigger>
                <TabsTrigger value="interview" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Interview</TabsTrigger>
                <TabsTrigger value="offer" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Offer</TabsTrigger>
                <TabsTrigger value="registration" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Registration</TabsTrigger>
                <TabsTrigger value="documents" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Documents</TabsTrigger>
                <TabsTrigger value="notes" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Notes</TabsTrigger>
                <TabsTrigger value="timeline" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Timeline</TabsTrigger>
              </TabsList>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <TabsContent value="personal"><PersonalTab applicant={applicant} /></TabsContent>
              <TabsContent value="ecclesial"><EcclesialTab applicant={applicant} /></TabsContent>
              <TabsContent value="bap"><BAPTab applicant={applicant} /></TabsContent>
              <TabsContent value="interview"><InterviewTab applicant={applicant} canEdit={canEdit} availableInterviewers={availableInterviewers} /></TabsContent>
              <TabsContent value="offer"><OfferTab applicant={applicant} canEdit={canEdit} /></TabsContent>
              <TabsContent value="registration"><RegistrationTab applicant={applicant} canEdit={canEdit} /></TabsContent>
              <TabsContent value="documents"><DocumentsTab applicant={applicant} canEdit={canEdit} allDocumentTypes={allDocumentTypes} documentChecklist={documentChecklist} /></TabsContent>
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
