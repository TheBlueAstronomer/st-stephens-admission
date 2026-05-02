import { describe, expect, it } from 'vitest';

describe('Rank 2 service-layer regressions', () => {
  it('defines applicant and interview workflow modules under the services convention', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const applicantWorkflowPath = path.resolve(__dirname, '../lib/services/applicant-workflows.ts');
    const interviewWorkflowPath = path.resolve(__dirname, '../lib/services/interview-workflows.ts');

    expect(fs.existsSync(applicantWorkflowPath)).toBe(true);
    expect(fs.existsSync(interviewWorkflowPath)).toBe(true);

    const applicantWorkflows = fs.readFileSync(applicantWorkflowPath, 'utf-8');
    const interviewWorkflows = fs.readFileSync(interviewWorkflowPath, 'utf-8');

    expect(applicantWorkflows).toContain('export async function createApplicantWorkflow(');
    expect(applicantWorkflows).toContain('export async function updateApplicantStatusWorkflow(');
    expect(applicantWorkflows).toContain('export async function updateApplicantDetailsWorkflow(');
    expect(applicantWorkflows).toContain('export async function exportApplicantsCsvWorkflow(');
    expect(interviewWorkflows).toContain('export async function scheduleInterviewWorkflow(');
    expect(interviewWorkflows).toContain('export async function recordInterviewOutcomeWorkflow(');
    expect(interviewWorkflows).toContain('export async function saveInterviewNotesWorkflow(');
    expect(interviewWorkflows).toContain('export async function markInvitationSentWorkflow(');
    expect(interviewWorkflows).toContain('export async function markApplicationReceivedWorkflow(');
  });

  it('applicant actions are thin wrappers over services instead of direct prisma orchestration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const actionsPath = path.resolve(__dirname, '../app/(staff)/applicants/actions.ts');
    const content = fs.readFileSync(actionsPath, 'utf-8');

    expect(content).toContain("from '@/lib/services/applicant-workflows'");
    expect(content).toContain('createApplicantWorkflow(');
    expect(content).toContain('updateApplicantStatusWorkflow(');
    expect(content).toContain('updateApplicantDetailsWorkflow(');
    expect(content).toContain('updateApplicantEcclesialWorkflow(');
    expect(content).toContain('updateApplicantBapWorkflow(');
    expect(content).toContain('exportApplicantsCsvWorkflow(');
    expect(content).not.toContain("from '@/lib/db'");
    expect(content).not.toContain("from '@/lib/audit-log'");
  });

  it('interview actions are thin wrappers over services instead of direct prisma orchestration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const actionsPath = path.resolve(__dirname, '../app/(staff)/interviews/actions.ts');
    const content = fs.readFileSync(actionsPath, 'utf-8');

    expect(content).toContain("from '@/lib/services/interview-workflows'");
    expect(content).toContain('scheduleInterviewWorkflow(');
    expect(content).toContain('recordInterviewOutcomeWorkflow(');
    expect(content).toContain('saveInterviewNotesWorkflow(');
    expect(content).toContain('markInvitationSentWorkflow(');
    expect(content).toContain('markApplicationReceivedWorkflow(');
    expect(content).not.toContain("from '@/lib/db'");
    expect(content).not.toContain("from '@/lib/audit-log'");
  });
});
