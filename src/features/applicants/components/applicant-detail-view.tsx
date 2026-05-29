'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  ArrowRightIcon,
  FolderSimpleIcon,
} from '@phosphor-icons/react';
import { StatusBadge } from '@/features/admissions-lifecycle/components/status-badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { STATUS_LABELS } from '@/features/admissions-lifecycle/constants/applicant-status';
import { VALID_TRANSITIONS } from '@/features/admissions-lifecycle/business-rules/status-transitions';
import { updateApplicantStatus } from '@/features/applicants/actions/applicant-actions';
import type { ApplicantStatus } from '@/generated/prisma/client';
import type { ApplicantFull, AvailableInterviewer } from '@/features/applicants/components/detail/shared';
import type { DocumentChecklistItem } from '@/features/documents/queries/documents';
import { useActionExecutor } from '@/hooks/use-action-executor';
import { getApplicantProgressStages } from '@/features/admissions-lifecycle/view-models/applicant-progress';
import {
  ApplicantProfileMotion,
  ApplicantTabPanelMotion,
  CurrentStagePulse,
} from '@/features/applicants/components/detail/applicant-detail-motion';
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
} from '@/features/applicants/components/detail/tabs';

interface ApplicantDetailViewProps {
  applicant: ApplicantFull;
  canEdit: boolean;
  availableInterviewers?: AvailableInterviewer[];
  allDocumentTypes?: { id: string; name: string }[];
  documentChecklist?: DocumentChecklistItem[];
}

const SPECIALIZED_WORKFLOW_STATUSES: ApplicantStatus[] = [
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
  'DECLINED',
  'WITHDRAWN',
  'REGISTRATION_FORM_RECEIVED',
  'DOCUMENTS_COMPLETE',
  'CONFIRMED_ORDINAND',
];

export function ApplicantDetailView({ applicant, canEdit, availableInterviewers = [], allDocumentTypes = [], documentChecklist = [] }: ApplicantDetailViewProps) {
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [isHydrated, setIsHydrated] = useState(false);
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
  const quickActionStatuses = nextStatuses.filter(
    (target) => !SPECIALIZED_WORKFLOW_STATUSES.includes(target),
  );
  const progressStages = getApplicantProgressStages(applicant.status, applicant.auditLogs);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsHydrated(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Left column — light panel */}
        <ApplicantProfileMotion className="w-full self-start overflow-hidden rounded-2xl lg:sticky lg:top-6">
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
                      <div className="relative h-[18px] w-[18px] rounded-full border-2 border-brand-ink flex items-center justify-center shrink-0">
                        <CurrentStagePulse />
                        <div className="relative h-[6px] w-[6px] rounded-full bg-brand-ink" />
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

          {/* SharePoint folder link */}
          <div className="border-t border-border" />
          <div className="px-6 py-3">
            {applicant.sharePointFolderUrl ? (
              <a
                href={applicant.sharePointFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-brand-ink"
              >
                <FolderSimpleIcon size={14} weight="light" className="shrink-0" />
                SharePoint Folder
              </a>
            ) : (
              <span className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <FolderSimpleIcon size={14} weight="light" className="shrink-0" />
                SharePoint Folder - Not linked
              </span>
            )}
          </div>

          {/* Quick Actions */}
          {canEdit && quickActionStatuses.length > 0 && (
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
                {quickActionStatuses.map((target) => (
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
        </ApplicantProfileMotion>

        {/* Right content */}
        <div className="min-w-0">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="gap-4">
            <div className="overflow-x-auto">
              <TabsList variant="line" className="w-max min-w-full flex gap-0 rounded-none bg-transparent px-0 h-auto pb-0">
                <TabsTrigger disabled={!isHydrated} value="personal" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Personal</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="ecclesial" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Ecclesial</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="bap" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">BAP</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="interview" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Interview</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="offer" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Offer</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="registration" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Registration</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="documents" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Documents</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="notes" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Notes</TabsTrigger>
                <TabsTrigger disabled={!isHydrated} value="timeline" className="px-4 pb-2.5 pt-1 rounded-none text-sm data-active:text-brand-ink data-active:border-b-brand-ink data-active:font-semibold">Timeline</TabsTrigger>
              </TabsList>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm md:p-6">
              <TabsContent value="personal">
                <ApplicantTabPanelMotion active={activeTab === 'personal'} motionKey="personal">
                  <PersonalTab applicant={applicant} />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="ecclesial">
                <ApplicantTabPanelMotion active={activeTab === 'ecclesial'} motionKey="ecclesial">
                  <EcclesialTab applicant={applicant} />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="bap">
                <ApplicantTabPanelMotion active={activeTab === 'bap'} motionKey="bap">
                  <BAPTab applicant={applicant} />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="interview">
                <ApplicantTabPanelMotion active={activeTab === 'interview'} motionKey="interview">
                  <InterviewTab applicant={applicant} canEdit={canEdit} availableInterviewers={availableInterviewers} />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="offer">
                <ApplicantTabPanelMotion active={activeTab === 'offer'} motionKey="offer">
                  <OfferTab applicant={applicant} canEdit={canEdit} />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="registration">
                <ApplicantTabPanelMotion active={activeTab === 'registration'} motionKey="registration">
                  <RegistrationTab applicant={applicant} canEdit={canEdit} />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="documents">
                <ApplicantTabPanelMotion active={activeTab === 'documents'} motionKey="documents">
                  <DocumentsTab applicant={applicant} canEdit={canEdit} allDocumentTypes={allDocumentTypes} documentChecklist={documentChecklist} />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="notes">
                <ApplicantTabPanelMotion active={activeTab === 'notes'} motionKey="notes">
                  <NotesTab />
                </ApplicantTabPanelMotion>
              </TabsContent>
              <TabsContent value="timeline">
                <ApplicantTabPanelMotion active={activeTab === 'timeline'} motionKey="timeline">
                  <TimelineTab applicant={applicant} />
                </ApplicantTabPanelMotion>
              </TabsContent>
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
