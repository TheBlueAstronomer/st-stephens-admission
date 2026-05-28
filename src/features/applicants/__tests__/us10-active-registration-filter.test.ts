/**
 * US-10: Declined/Withdrawn applicants in reports but not active registration.
 *
 * Tests that:
 * - buildActiveRegistrationWhereClause excludes DECLINED and WITHDRAWN applicants
 * - buildWhereClause (report queries) INCLUDES all statuses
 * - When a specific status filter is provided, it passes through as-is even for active registration
 */

import { describe, it, expect } from 'vitest';
import {
  buildWhereClause,
  buildActiveRegistrationWhereClause,
  INACTIVE_STATUSES,
} from '@/features/applicants/queries/applicant-filters';

describe('US-10: INACTIVE_STATUSES constant', () => {
  it('contains DECLINED and WITHDRAWN', () => {
    expect(INACTIVE_STATUSES).toContain('DECLINED');
    expect(INACTIVE_STATUSES).toContain('WITHDRAWN');
  });
});

describe('US-10: buildWhereClause (report queries — includes all statuses)', () => {
  it('does not add any status filter when no status param provided', () => {
    const where = buildWhereClause({});
    expect((where as Record<string, unknown>).status).toBeUndefined();
  });

  it('includes a specific status when explicitly provided', () => {
    const where = buildWhereClause({ status: 'DECLINED' });
    expect((where as Record<string, unknown>).status).toBe('DECLINED');
  });

  it('includes WITHDRAWN when explicitly filtered', () => {
    const where = buildWhereClause({ status: 'WITHDRAWN' });
    expect((where as Record<string, unknown>).status).toBe('WITHDRAWN');
  });

  it('returns results for all statuses — no blanket exclusion (reports include declined/withdrawn)', () => {
    const where = buildWhereClause({});
    // No notIn restriction — a report-style query shows all applicants
    const status = (where as Record<string, unknown>).status as Record<string, unknown> | undefined;
    expect(status).toBeUndefined();
  });
});

describe('US-10: buildActiveRegistrationWhereClause (pipeline / registration — excludes inactive)', () => {
  it('adds notIn filter for DECLINED and WITHDRAWN when no status provided', () => {
    const where = buildActiveRegistrationWhereClause({});
    const statusFilter = (where as Record<string, unknown>).status as Record<string, unknown>;
    expect(statusFilter).toBeDefined();
    expect(statusFilter.notIn).toEqual(expect.arrayContaining(['DECLINED', 'WITHDRAWN']));
  });

  it('excludes exactly DECLINED and WITHDRAWN — no other statuses blocked', () => {
    const where = buildActiveRegistrationWhereClause({});
    const notIn = ((where as Record<string, unknown>).status as Record<string, unknown>).notIn as string[];
    expect(notIn).toHaveLength(2);
    expect(notIn).toContain('DECLINED');
    expect(notIn).toContain('WITHDRAWN');
  });

  it('preserves an explicit status filter (caller override) — does not add notIn', () => {
    const where = buildActiveRegistrationWhereClause({ status: 'REGISTRATION_FORM_RECEIVED' });
    expect((where as Record<string, unknown>).status).toBe('REGISTRATION_FORM_RECEIVED');
  });

  it('preserves search filter alongside inactive exclusion', () => {
    const where = buildActiveRegistrationWhereClause({ search: 'Rachel' });
    expect((where as Record<string, unknown>).OR).toBeDefined();
    const statusFilter = (where as Record<string, unknown>).status as Record<string, unknown>;
    expect(statusFilter.notIn).toContain('DECLINED');
  });

  it('preserves admissionsYearId alongside inactive exclusion', () => {
    const where = buildActiveRegistrationWhereClause({ admissionsYearId: 'year-2025' });
    expect((where as Record<string, unknown>).admissionsYearId).toBe('year-2025');
    const statusFilter = (where as Record<string, unknown>).status as Record<string, unknown>;
    expect(statusFilter.notIn).toContain('WITHDRAWN');
  });
});

describe('US-10: Visual treatment — isInactive helper logic', () => {
  const isInactive = (status: string) => status === 'DECLINED' || status === 'WITHDRAWN';

  it('marks DECLINED as inactive', () => {
    expect(isInactive('DECLINED')).toBe(true);
  });

  it('marks WITHDRAWN as inactive', () => {
    expect(isInactive('WITHDRAWN')).toBe(true);
  });

  it('does not mark active statuses as inactive', () => {
    const activeStatuses = [
      'ENQUIRY',
      'VISIT_INVITED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_COMPLETED',
      'CONDITIONAL_OFFER',
      'UNCONDITIONAL_OFFER',
      'REGISTRATION_FORM_RECEIVED',
      'CONFIRMED_ORDINAND',
    ];
    for (const status of activeStatuses) {
      expect(isInactive(status)).toBe(false);
    }
  });
});
