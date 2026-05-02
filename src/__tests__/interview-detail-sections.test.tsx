import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ApplicantSummaryCard,
  InterviewHeaderCard,
  InterviewMetadataCard,
} from '@/components/interview-detail/sections';
import type { InterviewDetail } from '@/components/interview-detail/shared';

const interview: InterviewDetail = {
  id: 'interview-1',
  interviewType: 'EXPLORATORY_VISIT',
  status: 'SCHEDULED',
  scheduledAt: new Date('2026-03-10T10:00:00.000Z'),
  completedAt: null,
  outcome: null,
  notes: null,
  followUpActions: null,
  invitationSentAt: null,
  interviewApplicationReceivedAt: null,
  createdAt: new Date('2026-03-01T10:00:00.000Z'),
  updatedAt: new Date('2026-03-02T10:00:00.000Z'),
  panelMembers: [
    {
      user: {
        id: 'u-1',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    },
  ],
  createdBy: { id: 'creator', name: 'Admin One' },
  updatedBy: { id: 'updater', name: 'Admin Two' },
  invitationSentBy: null,
  applicant: {
    id: 'applicant-1',
    applicantId: 'APP-2026-001',
    legalName: 'John Candidate',
    preferredName: 'John',
    status: 'VISIT_INVITED',
    programme: { courseTitle: 'MA Theology' },
    diocese: { name: 'Oxford' },
    bapStatus: { stageOneStatus: 'COMPLETED' },
    ecclesialProfile: { directorOfOrdinandsName: 'Rev. Doe' },
  },
};

describe('interview detail extracted sections', () => {
  it('renders the interview header card details', () => {
    render(
      <InterviewHeaderCard
        interview={interview}
        canEdit={true}
        isPending={false}
        onMarkInvitation={() => {}}
        onMarkApplication={() => {}}
      />,
    );

    expect(screen.getByText('Exploratory Visit')).toBeInTheDocument();
    expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark invitation sent/i })).toBeInTheDocument();
  });

  it('renders the applicant summary card', () => {
    render(<ApplicantSummaryCard interview={interview} isAcademicStaff={false} />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('APP-2026-001')).toBeInTheDocument();
    expect(screen.getByText('MA Theology')).toBeInTheDocument();
    expect(screen.getByText('Rev. Doe')).toBeInTheDocument();
  });

  it('renders the interview metadata card', () => {
    render(<InterviewMetadataCard interview={interview} />);

    expect(screen.getByText('Created by Admin One')).toBeInTheDocument();
    expect(screen.getByText('Last updated by Admin Two')).toBeInTheDocument();
  });
});
