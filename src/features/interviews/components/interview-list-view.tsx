'use client';

import Link from 'next/link';
import {
  CalendarBlankIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { UserRole } from '@/generated/prisma/client';
import { formatDateTime } from '@/lib/formatters/date';

interface InterviewListItem {
  id: string;
  interviewType: string;
  status: string;
  scheduledAt: Date | null;
  outcome: string | null;
  invitationSentAt: Date | null;
  interviewApplicationReceivedAt: Date | null;
  applicant: {
    id: string;
    applicantId: string;
    legalName: string;
    status: string;
    programme: { courseTitle: string } | null;
  };
  panelMembers: {
    user: { id: string; name: string };
  }[];
}

interface InterviewListViewProps {
  interviews: InterviewListItem[];
  userRole: UserRole;
}

export function InterviewListView({ interviews, userRole }: InterviewListViewProps) {
  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-ink">Interviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === 'ACADEMIC_STAFF'
              ? 'Interviews assigned to you'
              : 'All scheduled and completed interviews'}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Interview cards */}
      {interviews.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia>
              <CalendarBlankIcon size={32} weight="light" className="text-muted-foreground/40" />
            </EmptyMedia>
            <EmptyTitle>No interviews found.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Link
              key={interview.id}
              href={`/interviews/${interview.id}`}
              className="block rounded-2xl border border-black/6 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-ink">
                      {interview.applicant.legalName}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {interview.applicant.applicantId}
                    </span>
                  </div>
                  {interview.applicant.programme && (
                    <p className="text-xs text-muted-foreground">
                      {interview.applicant.programme.courseTitle}
                    </p>
                  )}
                  {interview.scheduledAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarBlankIcon size={12} weight="light" />
                      {formatDateTime(
                        interview.scheduledAt,
                        {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        },
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </p>
                  )}
                  {interview.panelMembers.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <UserCircleIcon size={12} weight="light" />
                      {interview.panelMembers.map((pm) => pm.user.name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <Badge className="border-0 bg-brand-solid text-brand-solid-foreground text-xs">
                    {interview.interviewType === 'EXPLORATORY_VISIT' ? 'Exploratory' : 'Visit-Interview'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
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
                  {interview.outcome && (
                    <Badge
                      className={`border-0 text-xs ${
                        interview.outcome === 'RECOMMENDED'
                          ? 'bg-green-100 text-green-800'
                          : interview.outcome === 'NOT_RECOMMENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {interview.outcome.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
