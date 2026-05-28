import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatTime } from '@/lib/formatters/date';
import { getApplicantProgressStages } from '@/features/admissions-lifecycle/view-models/applicant-progress';

describe('Phase 3 extracted formatters and progress helpers', () => {
  it('formats dates and times consistently for en-GB display', () => {
    const value = new Date('2026-03-10T10:05:00.000Z');

    expect(formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' })).toBe('10 Mar 2026');
    expect(formatTime(value, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })).toBe('10:05');
    expect(
      formatDateTime(
        value,
        { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' },
        { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' },
      ),
    ).toBe('10 Mar 2026 at 10:05');
  });

  it('builds applicant progress stages with grouped current-step behavior', () => {
    const stages = getApplicantProgressStages('INTERVIEW_SCHEDULED');

    expect(stages).toHaveLength(5);
    expect(stages[0]).toMatchObject({ status: 'ENQUIRY', isCompleted: true, isCurrent: false });
    expect(stages[1]).toMatchObject({ status: 'VISIT_INVITED', isCompleted: true, isCurrent: true });
    expect(stages[2]).toMatchObject({ status: 'CONDITIONAL_OFFER', isCompleted: false, isCurrent: false });
    expect(stages[4]).toMatchObject({ status: 'CONFIRMED_ORDINAND', isLast: true });
  });
});
