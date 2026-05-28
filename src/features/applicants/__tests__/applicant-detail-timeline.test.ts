import { describe, expect, it } from 'vitest';
import { formatAuditAction, formatAuditTimelineEntry } from '@/features/applicants/components/detail/timeline';

describe('applicant detail timeline helpers', () => {
  it('maps known audit actions to readable copy', () => {
    expect(formatAuditAction('INTERVIEW_SCHEDULED')).toBe('scheduled interview');
    expect(formatAuditAction('STATUS_CHANGE')).toBe('changed status');
  });

  it('formats before and after values for timeline entries', () => {
    expect(
      formatAuditTimelineEntry({
        action: 'STATUS_CHANGE',
        previousValue: '"ENQUIRY"',
        newValue: '"VISIT_INVITED"',
      }),
    ).toBe('changed status: ENQUIRY → VISIT_INVITED');
  });

  it('formats create-like entries with only a new value', () => {
    expect(
      formatAuditTimelineEntry({
        action: 'INTERVIEW_SCHEDULED',
        newValue: '"Exploratory Visit"',
      }),
    ).toBe('scheduled interview: Exploratory Visit');
  });
});
