import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  prisma: {
    applicant: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    accommodationRequest: {
      findMany: vi.fn(),
    },
    bAPStatus: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockPrisma = prisma as unknown as {
  applicant: {
    count: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  accommodationRequest: {
    findMany: ReturnType<typeof vi.fn>;
  };
  bAPStatus: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

import {
  getDashboardKpis,
  getPipelineByStatus,
  getAccommodationSummary,
  getDioceseDistribution,
  getBapSummary,
} from '@/features/dashboard/queries/dashboard';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('F07 Dashboard Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildDashboardWhere (via getDashboardKpis filters)', () => {
    it('applies each filter independently', async () => {
      mockPrisma.applicant.count.mockResolvedValue(0);
      mockPrisma.accommodationRequest.findMany.mockResolvedValue([]);

      // Year filter only
      await getDashboardKpis({ admissionsYearId: 'year-1' });
      expect(mockPrisma.applicant.count.mock.calls[0][0].where).toMatchObject({
        admissionsYearId: 'year-1',
      });
      expect(mockPrisma.applicant.count.mock.calls[0][0].where).not.toHaveProperty('programmeId');

      vi.clearAllMocks();
      mockPrisma.applicant.count.mockResolvedValue(0);
      mockPrisma.accommodationRequest.findMany.mockResolvedValue([]);

      // Programme filter only
      await getDashboardKpis({ programmeId: 'prog-1' });
      expect(mockPrisma.applicant.count.mock.calls[0][0].where).toMatchObject({
        programmeId: 'prog-1',
      });
      expect(mockPrisma.applicant.count.mock.calls[0][0].where).not.toHaveProperty('admissionsYearId');
    });

    it('combines multiple filters as AND', async () => {
      mockPrisma.applicant.count.mockResolvedValue(0);
      mockPrisma.accommodationRequest.findMany.mockResolvedValue([]);

      await getDashboardKpis({
        admissionsYearId: 'year-1',
        programmeId: 'prog-1',
        dioceseId: 'dio-1',
        status: 'ENQUIRY',
      });

      // The first count call (totalEnquiries) should have all four filters
      expect(mockPrisma.applicant.count.mock.calls[0][0].where).toMatchObject({
        admissionsYearId: 'year-1',
        programmeId: 'prog-1',
        dioceseId: 'dio-1',
        status: 'ENQUIRY',
      });
    });

    it('returns unfiltered results when no filters provided', async () => {
      mockPrisma.applicant.count.mockResolvedValue(10);
      mockPrisma.accommodationRequest.findMany.mockResolvedValue([]);

      const kpis = await getDashboardKpis({});

      // where should be empty object
      expect(mockPrisma.applicant.count.mock.calls[0][0].where).toEqual({});
      expect(kpis.totalEnquiries).toBe(10);
    });
  });

  describe('getDashboardKpis', () => {
    it('returns accurate totals from the database', async () => {
      mockPrisma.applicant.count
        .mockResolvedValueOnce(47) // totalEnquiries
        .mockResolvedValueOnce(12) // totalInterviews
        .mockResolvedValueOnce(24) // totalOffers
        .mockResolvedValueOnce(18) // totalRegistrations
        .mockResolvedValueOnce(14); // confirmedOrdinands
      mockPrisma.accommodationRequest.findMany.mockResolvedValueOnce([
        { accommodationType: 'SINGLE' },
        { accommodationType: 'FAMILY' },
        { accommodationType: 'SINGLE' },
      ]);

      const kpis = await getDashboardKpis();

      expect(kpis.totalEnquiries).toBe(47);
      expect(kpis.totalInterviews).toBe(12);
      expect(kpis.totalOffers).toBe(24);
      expect(kpis.totalRegistrations).toBe(18);
      expect(kpis.confirmedOrdinands).toBe(14);
      expect(kpis.accommodationDemand).toBe(3);
    });

    it('passes filter params to queries', async () => {
      mockPrisma.applicant.count.mockResolvedValue(0);
      mockPrisma.accommodationRequest.findMany.mockResolvedValue([]);

      await getDashboardKpis({ admissionsYearId: 'year-1', dioceseId: 'dio-1' });

      // All count calls should include the filters
      for (const call of mockPrisma.applicant.count.mock.calls) {
        expect(call[0].where).toMatchObject({
          admissionsYearId: 'year-1',
          dioceseId: 'dio-1',
        });
      }
    });
  });

  describe('getPipelineByStatus', () => {
    it('returns counts per status matching seeded data', async () => {
      mockPrisma.applicant.groupBy.mockResolvedValueOnce([
        { status: 'ENQUIRY', _count: { id: 5 } },
        { status: 'CONFIRMED_ORDINAND', _count: { id: 3 } },
      ]);

      const pipeline = await getPipelineByStatus();

      const enquiry = pipeline.find((p) => p.status === 'ENQUIRY');
      const confirmed = pipeline.find((p) => p.status === 'CONFIRMED_ORDINAND');
      const declined = pipeline.find((p) => p.status === 'DECLINED');

      expect(enquiry?.count).toBe(5);
      expect(confirmed?.count).toBe(3);
      expect(declined?.count).toBe(0); // Not in groupBy result → 0
    });
  });

  describe('getAccommodationSummary', () => {
    it('correctly calculates total = singles + families', async () => {
      mockPrisma.accommodationRequest.findMany.mockResolvedValueOnce([
        { accommodationType: 'SINGLE', duration: 'TERM_TIME' },
        { accommodationType: 'SINGLE', duration: 'FULL_YEAR' },
        { accommodationType: 'FAMILY', duration: 'TERM_TIME' },
      ]);

      const summary = await getAccommodationSummary();

      expect(summary.singleRooms).toBe(2);
      expect(summary.familyUnits).toBe(1);
      expect(summary.totalDemand).toBe(3);
      expect(summary.termTime).toBe(2);
      expect(summary.fullYear).toBe(1);
    });

    it('returns zeros when no accommodation data exists', async () => {
      mockPrisma.accommodationRequest.findMany.mockResolvedValueOnce([]);

      const summary = await getAccommodationSummary();

      expect(summary.totalDemand).toBe(0);
      expect(summary.singleRooms).toBe(0);
      expect(summary.familyUnits).toBe(0);
    });
  });

  describe('getDioceseDistribution', () => {
    it('returns applicant counts grouped by diocese, sorted descending', async () => {
      mockPrisma.applicant.findMany.mockResolvedValueOnce([
        { diocese: { name: 'Oxford' } },
        { diocese: { name: 'Oxford' } },
        { diocese: { name: 'London' } },
        { diocese: { name: 'Oxford' } },
        { diocese: { name: 'London' } },
        { diocese: null },
      ]);

      const dist = await getDioceseDistribution();

      expect(dist[0].dioceseName).toBe('Oxford');
      expect(dist[0].applicantCount).toBe(3);
      expect(dist[1].dioceseName).toBe('London');
      expect(dist[1].applicantCount).toBe(2);
      expect(dist[2].dioceseName).toBe('Unknown');
      expect(dist[2].applicantCount).toBe(1);
    });
  });

  describe('getBapSummary', () => {
    it('returns stage 1 and stage 2 distribution', async () => {
      mockPrisma.bAPStatus.findMany.mockResolvedValueOnce([
        { stageOneStatus: 'COMPLETED', stageTwoStatus: 'INCOMPLETE' },
        { stageOneStatus: 'COMPLETED', stageTwoStatus: 'COMPLETED' },
        { stageOneStatus: 'SCHEDULED', stageTwoStatus: 'INCOMPLETE' },
      ]);

      const bap = await getBapSummary();

      const s1Completed = bap.stageOne.find((s) => s.status === 'COMPLETED');
      const s1Scheduled = bap.stageOne.find((s) => s.status === 'SCHEDULED');
      const s2Incomplete = bap.stageTwo.find((s) => s.status === 'INCOMPLETE');

      expect(s1Completed?.count).toBe(2);
      expect(s1Scheduled?.count).toBe(1);
      expect(s2Incomplete?.count).toBe(2);
    });
  });
});
