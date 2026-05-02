import { describe, expect, it } from 'vitest';
import {
  formatAuditValue,
  parseAuditValue,
  serializeAuditFields,
  serializeAuditScalar,
} from '@/lib/audit-log';

describe('audit-log helpers', () => {
  it('serializes scalar values using the canonical versioned payload shape', () => {
    const raw = serializeAuditScalar('status', 'ENQUIRY');

    expect(raw).toContain('"version":1');
    expect(parseAuditValue(raw)).toEqual({
      version: 1,
      label: 'status',
      value: 'ENQUIRY',
    });
  });

  it('serializes field payloads with normalized primitive values and target metadata', () => {
    const raw = serializeAuditFields(
      'Created applicant record',
      {
        createdAt: new Date('2025-01-10T12:00:00.000Z'),
        hasException: false,
        score: 4,
      },
      { type: 'Applicant', id: 'applicant-1' },
    );

    expect(parseAuditValue(raw)).toEqual({
      version: 1,
      summary: 'Created applicant record',
      fields: {
        createdAt: '2025-01-10T12:00:00.000Z',
        hasException: false,
        score: 4,
      },
      target: { type: 'Applicant', id: 'applicant-1' },
    });
  });

  it('parses legacy JSON objects into the canonical fields payload', () => {
    const parsed = parseAuditValue('{"status":"ENQUIRY","active":true}');

    expect(parsed).toEqual({
      version: 1,
      fields: {
        status: 'ENQUIRY',
        active: true,
      },
    });
  });

  it('treats invalid payload strings as raw scalar values', () => {
    expect(parseAuditValue('not-json')).toEqual({
      version: 1,
      value: 'not-json',
    });
  });

  it('formats scalar, summary, boolean, and empty values for timeline display', () => {
    expect(formatAuditValue(serializeAuditScalar('status', 'INTERVIEW_SCHEDULED'))).toBe(
      'status: INTERVIEW_SCHEDULED',
    );
    expect(
      formatAuditValue(
        serializeAuditFields('Updated applicant BAP exception', {
          hasStageOneBAPException: true,
        }),
      ),
    ).toBe('Updated applicant BAP exception');
    expect(formatAuditValue('{"version":1,"fields":{"active":true,"note":""}}')).toBe(
      'active: Yes, note: —',
    );
    expect(formatAuditValue(null)).toBe('');
  });
});
