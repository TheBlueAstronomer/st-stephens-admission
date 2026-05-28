import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  prisma: {
    applicant: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    offer: {
      count: vi.fn(),
    },
    accommodationRequest: {
      findMany: vi.fn(),
    },
    bAPStatus: {
      findMany: vi.fn(),
    },
    documentType: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const db = prisma as unknown as {
  applicant: { count: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  offer: { count: ReturnType<typeof vi.fn> };
  accommodationRequest: { findMany: ReturnType<typeof vi.fn> };
  bAPStatus: { findMany: ReturnType<typeof vi.fn> };
  documentType: { findMany: ReturnType<typeof vi.fn> };
};

import {
  getPipelineReport,
  getDioceseReport,
  getBapReport,
  getOffersRegistrationsReport,
  getAccommodationReport,
  getMissingDocsReport,
} from '@/features/reports/queries/reports';

import { generateCsv, reportFilename, type CsvColumn } from '@/features/reports/services/csv-export';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('F07 Reports', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Pipeline Report (US-03)', () => {
    it('returns correct counts grouped by status', async () => {
      db.applicant.groupBy.mockResolvedValueOnce([
        { status: 'ENQUIRY', _count: { id: 5 } },
        { status: 'CONDITIONAL_OFFER', _count: { id: 3 } },
      ]);
      db.applicant.findMany.mockResolvedValueOnce([
        { status: 'ENQUIRY', programme: { courseTitle: 'BA in Theology' } },
        { status: 'ENQUIRY', programme: { courseTitle: 'MA in Applied Theology' } },
        { status: 'CONDITIONAL_OFFER', programme: { courseTitle: 'BA in Theology' } },
      ]);
      db.applicant.count.mockResolvedValueOnce(8);

      const report = await getPipelineReport();

      const enquiry = report.rows.find((r) => r.status === 'ENQUIRY');
      expect(enquiry?.count).toBe(5);
      expect(enquiry?.percentage).toBe(63); // 5/8 = 62.5 → 63

      const cond = report.rows.find((r) => r.status === 'CONDITIONAL_OFFER');
      expect(cond?.count).toBe(3);
    });

    it('shows programme breakdown', async () => {
      db.applicant.groupBy.mockResolvedValueOnce([]);
      db.applicant.findMany.mockResolvedValueOnce([
        { status: 'ENQUIRY', programme: { courseTitle: 'BA in Theology' } },
        { status: 'ENQUIRY', programme: { courseTitle: 'BA in Theology' } },
        { status: 'ENQUIRY', programme: { courseTitle: 'MA in Applied Theology' } },
      ]);
      db.applicant.count.mockResolvedValueOnce(3);

      const report = await getPipelineReport();

      const ba = report.programmeBreakdown.find((p) => p.programmeName === 'BA in Theology');
      expect(ba?.counts['ENQUIRY']).toBe(2);

      const ma = report.programmeBreakdown.find((p) => p.programmeName === 'MA in Applied Theology');
      expect(ma?.counts['ENQUIRY']).toBe(1);
    });
  });

  describe('Diocese Distribution Report (US-04)', () => {
    it('returns applicant, offer, and ordinand counts by diocese', async () => {
      db.applicant.findMany.mockResolvedValueOnce([
        { status: 'ENQUIRY', diocese: { name: 'Oxford' }, offer: null },
        { status: 'CONDITIONAL_OFFER', diocese: { name: 'Oxford' }, offer: { offerType: 'CONDITIONAL' } },
        { status: 'CONFIRMED_ORDINAND', diocese: { name: 'Oxford' }, offer: { offerType: 'UNCONDITIONAL' } },
        { status: 'ENQUIRY', diocese: { name: 'London' }, offer: null },
      ]);

      const { rows } = await getDioceseReport();

      const oxford = rows.find((r) => r.dioceseName === 'Oxford');
      expect(oxford?.applicantCount).toBe(3);
      expect(oxford?.offerCount).toBe(2);
      expect(oxford?.confirmedOrdinandCount).toBe(1);

      const london = rows.find((r) => r.dioceseName === 'London');
      expect(london?.applicantCount).toBe(1);
      expect(london?.offerCount).toBe(0);
    });
  });

  describe('BAP Status Report (US-05)', () => {
    it('returns stage distribution and blocked applicants', async () => {
      db.bAPStatus.findMany.mockResolvedValueOnce([
        {
          stageOneStatus: 'COMPLETED', stageTwoStatus: 'INCOMPLETE', hasStageOneBAPException: false,
          applicant: { id: '1', legalName: 'A', status: 'ENQUIRY' },
        },
        {
          stageOneStatus: 'INCOMPLETE', stageTwoStatus: 'INCOMPLETE', hasStageOneBAPException: false,
          applicant: { id: '2', legalName: 'B', status: 'ENQUIRY' },
        },
        {
          stageOneStatus: 'INCOMPLETE', stageTwoStatus: 'NOT_APPLICABLE', hasStageOneBAPException: true,
          applicant: { id: '3', legalName: 'C', status: 'ENQUIRY' },
        },
      ]);

      const { distribution, blockedApplicants } = await getBapReport();

      const s1Incomplete = distribution.find((d) => d.status === 'INCOMPLETE');
      expect(s1Incomplete?.stageOneCount).toBe(2);

      // Only applicant B is blocked (INCOMPLETE + no exception)
      expect(blockedApplicants).toHaveLength(1);
      expect(blockedApplicants[0].legalName).toBe('B');
    });
  });

  describe('Offers vs Registrations (US-06)', () => {
    it('returns funnel counts', async () => {
      db.applicant.count
        .mockResolvedValueOnce(5) // conditional
        .mockResolvedValueOnce(3) // unconditional
        .mockResolvedValueOnce(4) // registrations
        .mockResolvedValueOnce(2); // confirmed
      db.offer.count.mockResolvedValueOnce(6); // accepted

      const report = await getOffersRegistrationsReport();

      expect(report.conditionalOffers).toBe(5);
      expect(report.unconditionalOffers).toBe(3);
      expect(report.acceptedOffers).toBe(6);
      expect(report.registrationsReceived).toBe(4);
      expect(report.confirmedOrdinands).toBe(2);
    });
  });

  describe('Accommodation Demand Report (US-07)', () => {
    it('correctly calculates total = singles + families', async () => {
      db.accommodationRequest.findMany.mockResolvedValueOnce([
        { accommodationType: 'SINGLE', duration: 'TERM_TIME', familyUnitSize: null, applicant: { applicantId: 'A1', legalName: 'X' } },
        { accommodationType: 'FAMILY', duration: 'FULL_YEAR', familyUnitSize: 3, applicant: { applicantId: 'A2', legalName: 'Y' } },
        { accommodationType: 'FAMILY', duration: 'TERM_TIME', familyUnitSize: 4, applicant: { applicantId: 'A3', legalName: 'Z' } },
      ]);

      const report = await getAccommodationReport();

      expect(report.totalDemand).toBe(3);
      expect(report.singleRooms).toBe(1);
      expect(report.familyUnits).toBe(2);
      expect(report.termTime).toBe(2);
      expect(report.fullYear).toBe(1);
      expect(report.avgFamilySize).toBe(3.5);
      expect(report.rows).toHaveLength(3);
    });
  });

  describe('Missing Documents Report (US-08)', () => {
    it('lists only applicants with outstanding non-waived documents', async () => {
      db.applicant.findMany.mockResolvedValueOnce([
        {
          id: '1', applicantId: 'SSH-1', legalName: 'Alice', status: 'ENQUIRY',
          documents: [
            { isReceived: true, isWaived: false, documentTypeId: 'dt1', documentType: { name: 'GCSE' } },
          ],
        },
        {
          id: '2', applicantId: 'SSH-2', legalName: 'Bob', status: 'CONDITIONAL_OFFER',
          documents: [
            { isReceived: false, isWaived: true, documentTypeId: 'dt2', documentType: { name: 'DBS' }, waiverNote: 'Mature student' },
          ],
        },
      ]);
      db.documentType.findMany.mockResolvedValueOnce([
        { id: 'dt1', name: 'GCSE' },
        { id: 'dt2', name: 'DBS' },
        { id: 'dt3', name: 'Ref Letter' },
      ]);

      const { missingRows, waivedRows } = await getMissingDocsReport();

      // Alice: dt1 received → still missing dt2 (waived by Bob, but Alice doesn't have it) and dt3
      // Actually: Alice has dt1 received. Her receivedOrWaivedIds = {dt1}. Missing = dt2, dt3
      expect(missingRows).toHaveLength(2); // Both Alice and Bob have missing docs

      // Alice missing: DBS, Ref Letter
      const aliceMissing = missingRows.find((r) => r.legalName === 'Alice');
      expect(aliceMissing?.missingDocuments).toContain('DBS');
      expect(aliceMissing?.missingDocuments).toContain('Ref Letter');

      // Bob missing: GCSE, Ref Letter (DBS is waived)
      const bobMissing = missingRows.find((r) => r.legalName === 'Bob');
      expect(bobMissing?.missingDocuments).toContain('GCSE');
      expect(bobMissing?.missingDocuments).toContain('Ref Letter');
      expect(bobMissing?.missingDocuments).not.toContain('DBS');

      // Waived docs
      expect(waivedRows).toHaveLength(1);
      expect(waivedRows[0].documentName).toBe('DBS');
      expect(waivedRows[0].waiverNote).toBe('Mature student');
    });
  });
});

describe('CSV Export — All Reports (US-09)', () => {
  it('Pipeline CSV contains all displayed columns', () => {
    const columns: CsvColumn<{ status: string; count: number; pct: number }>[] = [
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Count', accessor: (r) => r.count },
      { header: '% of Total', accessor: (r) => r.pct },
    ];
    const csv = generateCsv(columns, [
      { status: 'Enquiry', count: 5, pct: 50 },
      { status: 'Offer', count: 3, pct: 30 },
    ]);
    expect(csv).toContain('Status,Count,% of Total');
    expect(csv).toContain('Enquiry,5,50');
    expect(csv).toContain('Offer,3,30');
  });

  it('Accommodation CSV contains all columns and rows', () => {
    const columns: CsvColumn<{ id: string; name: string; type: string }>[] = [
      { header: 'ID', accessor: (r) => r.id },
      { header: 'Name', accessor: (r) => r.name },
      { header: 'Type', accessor: (r) => r.type },
    ];
    const csv = generateCsv(columns, [
      { id: 'A1', name: 'X', type: 'SINGLE' },
    ]);
    expect(csv).toContain('ID,Name,Type');
    expect(csv).toContain('A1,X,SINGLE');
  });

  it('Missing Docs CSV contains all columns', () => {
    const columns: CsvColumn<{ id: string; name: string; docs: string }>[] = [
      { header: 'Applicant ID', accessor: (r) => r.id },
      { header: 'Name', accessor: (r) => r.name },
      { header: 'Missing', accessor: (r) => r.docs },
    ];
    const csv = generateCsv(columns, [
      { id: 'SSH-1', name: 'Bob', docs: 'GCSE; DBS' },
    ]);
    expect(csv).toContain('Applicant ID,Name,Missing');
    expect(csv).toContain('SSH-1,Bob,GCSE; DBS');
  });

  it('filenames are descriptively named', () => {
    expect(reportFilename('pipeline-report')).toMatch(/^ssh-pipeline-report-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(reportFilename('accommodation-demand')).toMatch(/^ssh-accommodation-demand-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(reportFilename('missing-documents')).toMatch(/^ssh-missing-documents-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe('CSV Export Utility', () => {
  it('generates CSV with headers and rows', () => {
    const columns: CsvColumn<{ name: string; age: number }>[] = [
      { header: 'Name', accessor: (r) => r.name },
      { header: 'Age', accessor: (r) => r.age },
    ];
    const rows = [
      { name: 'Alice', age: 30 },
      { name: 'Bob, Jr.', age: 25 },
    ];
    const csv = generateCsv(columns, rows);

    expect(csv).toContain('Name,Age');
    expect(csv).toContain('Alice,30');
    expect(csv).toContain('"Bob, Jr.",25'); // comma → quoted
  });

  it('generates descriptive filenames', () => {
    const filename = reportFilename('pipeline-report');
    expect(filename).toMatch(/^ssh-pipeline-report-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
