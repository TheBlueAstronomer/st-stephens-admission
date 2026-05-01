'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  CalendarBlank,
} from '@phosphor-icons/react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  PROGRESS_STAGES,
  isStatusAtOrPast,
  STATUS_LABELS,
} from '@/lib/constants/applicant-status';
import { VALID_TRANSITIONS } from '@/lib/business-rules/status-transitions';
import { updateApplicantStatus } from '@/app/(staff)/applicants/actions';
import type { ApplicantStatus, AuditAction } from '@/generated/prisma/client';

type ApplicantFull = NonNullable<Awaited<ReturnType<typeof import('@/lib/queries/applicants').getApplicantById>>>;

interface ApplicantDetailViewProps {
  applicant: ApplicantFull;
  canEdit: boolean;
}

export function ApplicantDetailView({ applicant, canEdit }: ApplicantDetailViewProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const router = useRouter();

  const initials = applicant.legalName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const nextStatuses = VALID_TRANSITIONS[applicant.status] ?? [];

  const handleAdvanceStatus = async (targetStatus: ApplicantStatus) => {
    if (!confirm(`Are you sure you want to advance to "${STATUS_LABELS[targetStatus]}"?`)) return;
    setStatusError(null);

    startTransition(async () => {
      const result = await updateApplicantStatus(applicant.id, targetStatus);
      if (!result.success) {
        setStatusError(result.error ?? 'Failed to update status.');
      } else {
        router.refresh();
      }
    });
  };

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'ecclesial', label: 'Ecclesial' },
    { id: 'bap', label: 'BAP' },
    { id: 'interview', label: 'Interview' },
    { id: 'offer', label: 'Offer' },
    { id: 'registration', label: 'Registration' },
    { id: 'documents', label: 'Documents' },
    { id: 'notes', label: 'Notes' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/applicants" className="hover:text-[#1A2744] transition-colors">
          Applicants
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-[#1A2744] font-medium">{applicant.legalName}</span>
      </nav>

      <div className="flex gap-6">
        {/* Left column — dark navy sidebar panel */}
        <div className="w-[280px] shrink-0 sticky top-6 self-start space-y-0 rounded-2xl bg-[#1A2744] text-white overflow-hidden shadow-lg shadow-[#1A2744]/20">
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
            {PROGRESS_STAGES.map((stage, idx) => {
              const isCompleted = isStatusAtOrPast(applicant.status, stage.status);
              const isCurrent = applicant.status === stage.status ||
                (stage.status === 'VISIT_INVITED' && ['VISIT_INVITED', 'INTERVIEW_APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(applicant.status)) ||
                (stage.status === 'CONDITIONAL_OFFER' && ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER'].includes(applicant.status)) ||
                (stage.status === 'REGISTRATION_FORM_RECEIVED' && ['REGISTRATION_FORM_RECEIVED', 'DOCUMENTS_COMPLETE'].includes(applicant.status));
              const isLast = idx === PROGRESS_STAGES.length - 1;

              return (
                <div key={stage.status} className="flex items-stretch gap-3">
                  {/* Icon + connecting line */}
                  <div className="flex flex-col items-center">
                    {isCompleted ? (
                      <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="h-[18px] w-[18px] rounded-full border-2 border-white bg-white/20 shrink-0" />
                    ) : (
                      <Circle size={18} weight="light" className="text-white/25 shrink-0" />
                    )}
                    {!isLast && (
                      <div className={`w-px flex-1 my-1 ${isCompleted ? 'bg-emerald-400/40' : 'bg-white/10'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-sm pb-3 ${
                      isCurrent
                        ? 'font-semibold text-white'
                        : isCompleted
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
                    onClick={() => handleAdvanceStatus(target)}
                  >
                    <ArrowRight size={14} weight="light" className="mr-2" />
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
          {/* Tabs */}
          <div className="flex gap-0.5 overflow-x-auto mb-6 bg-[#F8F7F5] rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-white text-[#1A2744] shadow-sm shadow-black/[0.06]'
                    : 'text-muted-foreground hover:text-[#1A2744]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm shadow-black/[0.03]">
            {activeTab === 'personal' && <PersonalTab applicant={applicant} />}
            {activeTab === 'ecclesial' && <EcclesialTab applicant={applicant} />}
            {activeTab === 'bap' && <BAPTab applicant={applicant} />}
            {activeTab === 'interview' && <InterviewTab applicant={applicant} />}
            {activeTab === 'offer' && <OfferTab applicant={applicant} />}
            {activeTab === 'registration' && <RegistrationTab applicant={applicant} />}
            {activeTab === 'documents' && <DocumentsTab applicant={applicant} />}
            {activeTab === 'notes' && <NotesTab applicant={applicant} />}
            {activeTab === 'timeline' && <TimelineTab applicant={applicant} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Components ─────────────────────────────────────────────────────────

function PersonalTab({ applicant }: { applicant: ApplicantFull }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <Field label="Legal Name" value={applicant.legalName} />
      <Field label="Preferred Name" value={applicant.preferredName} />
      <Field label="Date of Birth" value={applicant.dateOfBirth ? new Date(applicant.dateOfBirth).toLocaleDateString('en-GB') : null} />
      <Field label="Email" value={applicant.email} />
      <Field label="Phone" value={applicant.phone} />
      <Field label="Address" value={[applicant.addressLineOne, applicant.addressLineTwo, applicant.city, applicant.postcode, applicant.country].filter(Boolean).join(', ') || null} />
      <Field label="Programme" value={applicant.programme?.courseTitle} />
    </dl>
  );
}

function EcclesialTab({ applicant }: { applicant: ApplicantFull }) {
  const ep = applicant.ecclesialProfile;
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <Field label="Diocese" value={applicant.diocese?.name} />
      <Field label="DDO Name" value={ep?.directorOfOrdinandsName} />
      <Field label="DDO Email" value={ep?.directorOfOrdinandsEmail} />
      <Field label="DDO Phone" value={ep?.directorOfOrdinandsPhone} />
      <Field label="Sponsoring Bishop" value={ep?.sponsoringBishopName} />
      <Field label="Bishop Email" value={ep?.sponsoringBishopEmail} />
    </dl>
  );
}

function BAPTab({ applicant }: { applicant: ApplicantFull }) {
  const bap = applicant.bapStatus;
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
        <Field label="Stage 1 Status" value={bap?.stageOneStatus} />
        <Field label="Stage 1 Date" value={bap?.stageOneDate ? new Date(bap.stageOneDate).toLocaleDateString('en-GB') : null} />
        <Field label="Stage 2 Status" value={bap?.stageTwoStatus} />
        <Field label="Stage 2 Date" value={bap?.stageTwoDate ? new Date(bap.stageTwoDate).toLocaleDateString('en-GB') : null} />
      </dl>
      {applicant.hasStageOneBAPException && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <strong>BAP Exception recorded:</strong> {applicant.stageOneBAPExceptionReason}
        </Alert>
      )}
      {bap && bap.stageOneStatus !== 'COMPLETED' && bap.stageOneStatus !== 'SCHEDULED' && !applicant.hasStageOneBAPException && (
        <Alert variant="destructive">
          Stage 1 BAP must be Completed or Scheduled before progressing past Enquiry.
          You may record an exception with a reason to bypass this requirement.
        </Alert>
      )}
    </div>
  );
}

function InterviewTab({ applicant }: { applicant: ApplicantFull }) {
  if (applicant.interviews.length === 0) {
    return <EmptyState message="No interviews recorded yet." />;
  }
  return (
    <div className="space-y-4">
      {applicant.interviews.map((interview) => (
        <div key={interview.id} className="rounded-2xl border border-black/[0.06] bg-[#FAFAF9] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Badge>{interview.interviewType.replace('_', ' ')}</Badge>
            <Badge variant="outline">{interview.status}</Badge>
          </div>
          {interview.scheduledAt && (
            <p className="text-sm text-muted-foreground">
              <CalendarBlank size={14} weight="light" className="inline mr-1" />
              {new Date(interview.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {interview.outcome && (
            <p className="text-sm">Outcome: <strong>{interview.outcome}</strong></p>
          )}
          {interview.notes && (
            <p className="text-sm text-muted-foreground">{interview.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function OfferTab({ applicant }: { applicant: ApplicantFull }) {
  if (!applicant.offer) {
    return <EmptyState message="No offer decision recorded yet." />;
  }
  const o = applicant.offer;
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <Field label="Offer Type" value={o.offerType} />
      <Field label="Decision Date" value={o.decisionDate ? new Date(o.decisionDate).toLocaleDateString('en-GB') : null} />
      <Field label="Conditions" value={o.conditions} />
      <Field label="Decision Notes" value={o.decisionNotes} />
    </dl>
  );
}

function RegistrationTab({ applicant }: { applicant: ApplicantFull }) {
  if (!applicant.registration) {
    return <EmptyState message="No registration form received yet." />;
  }
  const r = applicant.registration;
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      <Field label="Form Received" value={r.registrationFormReceivedAt ? new Date(r.registrationFormReceivedAt).toLocaleDateString('en-GB') : null} />
      <Field label="Contact Confirmed" value={r.contactDetailsConfirmed ? 'Yes' : 'No'} />
      <Field label="Programme Confirmed" value={r.programmeConfirmed ? 'Yes' : 'No'} />
      <Field label="Bishop Confirmed" value={r.bishopDetailsConfirmed ? 'Yes' : 'No'} />
      <Field label="Documents Submitted" value={r.areSupportingDocumentsSubmitted ? 'Yes' : 'No'} />
      <Field label="Electronic Signature" value={r.electronicSignature ? 'Yes' : 'No'} />
    </dl>
  );
}

function DocumentsTab({ applicant }: { applicant: ApplicantFull }) {
  if (applicant.documents.length === 0) {
    return <EmptyState message="No documents tracked yet." />;
  }
  return (
    <div className="space-y-2">
      {applicant.documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-black/[0.06] bg-[#FAFAF9] p-3.5">
          <div>
            <p className="text-sm font-medium">{doc.documentType?.name ?? doc.fileName ?? 'Unknown Document'}</p>
            {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
          </div>
          <div className="flex items-center gap-2">
            {doc.isReceived && <Badge className="bg-green-100 text-green-800 border-0">Received</Badge>}
            {doc.isWaived && <Badge className="bg-gray-100 text-gray-600 border-0">Waived</Badge>}
            {!doc.isReceived && !doc.isWaived && doc.isRequired && (
              <Badge className="bg-red-100 text-red-800 border-0">Outstanding</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesTab(_props: { applicant: ApplicantFull }) {
  return <EmptyState message="Notes feature coming in a future update." />;
}

function TimelineTab({ applicant }: { applicant: ApplicantFull }) {
  if (applicant.auditLogs.length === 0) {
    return <EmptyState message="No audit entries yet." />;
  }
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
      {applicant.auditLogs.map((log) => (
        <div key={log.id} className="flex gap-3 text-sm border-l-2 border-[#1A2744]/10 pl-3">
          <span className="shrink-0 font-mono text-xs text-muted-foreground w-[130px]">
            {new Date(log.performedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' '}
            {new Date(log.performedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div>
            <span className="font-medium">{log.user?.name ?? 'System'}</span>
            {' '}
            <span className="text-muted-foreground">{formatAction(log.action)}</span>
            {log.previousValue && log.newValue && (
              <span className="text-muted-foreground">
                : {log.previousValue} <ArrowRight size={12} weight="light" className="inline" /> {log.newValue}
              </span>
            )}
            {!log.previousValue && log.newValue && (
              <span className="text-muted-foreground">: {log.newValue}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-[#1A2744] font-medium">{value || '—'}</dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
      <div className="h-10 w-10 rounded-full bg-[#F8F7F5] flex items-center justify-center mb-3">
        <Circle size={20} weight="light" className="text-muted-foreground/40" />
      </div>
      {message}
    </div>
  );
}

function formatAction(action: AuditAction): string {
  const map: Record<string, string> = {
    CREATE: 'created this record',
    UPDATE: 'updated',
    DELETE: 'deleted',
    STATUS_CHANGE: 'changed status',
    OFFER_DECISION: 'recorded offer decision',
    DOCUMENT_RECEIVED: 'received document',
    DOCUMENT_WAIVED: 'waived document',
    INTERVIEW_OUTCOME: 'recorded interview outcome',
    CONFIRMED_ORDINAND: 'confirmed ordinand status',
  };
  return map[action] ?? action;
}
