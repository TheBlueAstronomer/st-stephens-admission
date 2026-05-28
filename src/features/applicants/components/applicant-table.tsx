'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StatusBadge } from '@/features/admissions-lifecycle/components/status-badge';
import type { ApplicantStatus, BAPStageStatus } from '@/generated/prisma/client';
import { formatDate } from '@/lib/formatters/date';

interface ApplicantRow {
  id: string;
  applicantId: string;
  legalName: string;
  preferredName: string | null;
  email: string | null;
  status: ApplicantStatus;
  programme: { id: string; courseTitle: string } | null;
  diocese: { id: string; name: string } | null;
  admissionsYear: { id: string; label: string } | null;
  bapStatus: { stageOneStatus: BAPStageStatus } | null;
  documents: { isReceived: boolean; isRequired: boolean }[];
  interviews: { scheduledAt: Date | null; status: string }[];
  offer: { offerType: string } | null;
  registration: { receivedAt: Date | null } | null;
}

interface ApplicantTableProps {
  applicants: ApplicantRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function ApplicantTable({
  applicants,
  total,
  page,
  totalPages,
}: ApplicantTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/applicants?${params.toString()}`);
  };

  if (applicants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">No applicants found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm shadow-black/3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/6">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Programme</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Diocese</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">BAP</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Interview</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Offer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Docs</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant, idx) => {
              const docsTotal = applicant.documents.filter((d) => d.isRequired).length;
              const docsReceived = applicant.documents.filter(
                (d) => d.isRequired && d.isReceived,
              ).length;
              const nextInterview = applicant.interviews[0];
              const isInactive = applicant.status === 'DECLINED' || applicant.status === 'WITHDRAWN';

              return (
                <tr
                  key={applicant.id}
                  className={`cursor-pointer border-b border-black/4 transition-all duration-150 hover:bg-brand-ink/2 ${isInactive ? 'opacity-50' : ''}`}
                  style={{
                    animation: `fadeInUp 300ms ${idx * 30}ms both`,
                  }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/applicants/${applicant.id}`}
                      className="block"
                    >
                      <div className={`font-medium ${isInactive ? 'text-muted-foreground line-through' : 'text-brand-ink'}`}>
                        {applicant.legalName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {applicant.applicantId}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/applicants/${applicant.id}`}>
                      <StatusBadge status={applicant.status} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={`/applicants/${applicant.id}`} className="block">
                      {applicant.programme?.courseTitle ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={`/applicants/${applicant.id}`} className="block">
                      {applicant.diocese?.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={`/applicants/${applicant.id}`} className="block">
                      {applicant.bapStatus?.stageOneStatus === 'COMPLETED'
                        ? '✓'
                        : applicant.bapStatus?.stageOneStatus === 'SCHEDULED'
                          ? 'Sched.'
                          : '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={`/applicants/${applicant.id}`} className="block">
                      {nextInterview?.scheduledAt
                        ? formatDate(nextInterview.scheduledAt, {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={`/applicants/${applicant.id}`} className="block">
                      {applicant.offer?.offerType ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={`/applicants/${applicant.id}`} className="block">
                      {docsTotal > 0 ? `${docsReceived}/${docsTotal}` : '—'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} applicants
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-full border border-black/6 px-3 py-1.5 text-sm transition-all hover:border-brand-ink/20 hover:bg-brand-ink/4 disabled:opacity-30 disabled:hover:border-black/6 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm font-medium text-brand-ink tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-full border border-black/6 px-3 py-1.5 text-sm transition-all hover:border-brand-ink/20 hover:bg-brand-ink/4 disabled:opacity-30 disabled:hover:border-black/6 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
