import { describe, expect, it } from 'vitest';

describe('Rank 7 stronger view model regressions', () => {
  it('exports explicit applicant and interview detail query payload types', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const applicantsQueryPath = path.resolve(__dirname, '../lib/queries/applicants.ts');
    const interviewsQueryPath = path.resolve(__dirname, '../lib/queries/interviews.ts');
    const applicantsQuery = fs.readFileSync(applicantsQueryPath, 'utf-8');
    const interviewsQuery = fs.readFileSync(interviewsQueryPath, 'utf-8');

    expect(applicantsQuery).toContain('export type ApplicantDetail = Prisma.ApplicantGetPayload');
    expect(interviewsQuery).toContain('export type InterviewDetailRecord = Prisma.InterviewGetPayload');
  });

  it('applicant and interview detail UIs avoid authored runtime shape checks and page-level casts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const applicantTabsPath = path.resolve(__dirname, '../components/applicant-detail/tabs.tsx');
    const interviewPagePath = path.resolve(__dirname, '../app/(staff)/interviews/[id]/page.tsx');
    const applicantSharedPath = path.resolve(__dirname, '../components/applicant-detail/shared.tsx');
    const interviewSharedPath = path.resolve(__dirname, '../components/interview-detail/shared.ts');
    const applicantTabs = fs.readFileSync(applicantTabsPath, 'utf-8');
    const interviewPage = fs.readFileSync(interviewPagePath, 'utf-8');
    const applicantShared = fs.readFileSync(applicantSharedPath, 'utf-8');
    const interviewShared = fs.readFileSync(interviewSharedPath, 'utf-8');

    expect(applicantTabs).not.toContain("'panelMembers' in interview");
    expect(applicantTabs).not.toContain('Record<string, unknown>');
    expect(interviewPage).not.toContain("React.ComponentProps<typeof InterviewDetailView>['interview']");
    expect(applicantShared).toContain("export type ApplicantFull = ApplicantDetail;");
    expect(interviewShared).toContain("export type InterviewDetail = InterviewDetailRecord;");
  });
});
