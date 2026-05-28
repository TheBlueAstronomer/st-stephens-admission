import { describe, expect, it } from 'vitest';

describe('Phase 1 regression guards', () => {
  it('applicant actions expose typed update APIs and no generic updateApplicant patch action', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const actionsPath = path.resolve(__dirname, '../features/applicants/actions/applicant-actions.ts');
    const content = fs.readFileSync(actionsPath, 'utf-8');

    expect(content).toContain('export async function updateApplicantDetails(');
    expect(content).toContain('export async function updateApplicantEcclesial(');
    expect(content).toContain('export async function updateApplicantBap(');
    expect(content).not.toContain('export async function updateApplicant(');
  });

  it('typed applicant update actions retain admissions/admin authorization guards', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const actionsPath = path.resolve(__dirname, '../features/applicants/actions/applicant-actions.ts');
    const content = fs.readFileSync(actionsPath, 'utf-8');

    expect(content).toContain("export async function updateApplicantDetails(");
    expect(content).toContain("export async function updateApplicantEcclesial(");
    expect(content).toContain("export async function updateApplicantBap(");
    expect(content.match(/requireRole\('ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR'\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('applicant validation defines explicit update schemas for each domain slice', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const validationsPath = path.resolve(__dirname, '../features/applicants/validations/applicant.ts');
    const content = fs.readFileSync(validationsPath, 'utf-8');

    expect(content).toContain('export const updateApplicantDetailsSchema');
    expect(content).toContain('export const updateApplicantEcclesialSchema');
    expect(content).toContain('export const updateApplicantBapSchema');
    expect(content).not.toContain('export const updateApplicantSchema');
  });

  it('audit writes use structured serializers in applicant and interview actions', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const applicantWorkflowsPath = path.resolve(__dirname, '../features/applicants/services/applicant-workflows.ts');
    const interviewWorkflowsPath = path.resolve(__dirname, '../features/interviews/services/interview-workflows.ts');
    const applicantWorkflows = fs.readFileSync(applicantWorkflowsPath, 'utf-8');
    const interviewWorkflows = fs.readFileSync(interviewWorkflowsPath, 'utf-8');

    expect(applicantWorkflows).toContain('serializeAuditFields');
    expect(applicantWorkflows).toContain('serializeAuditScalar');
    expect(applicantWorkflows).toContain('applicantId,');
    expect(applicantWorkflows).toContain("entityType: 'Applicant'");
    expect(applicantWorkflows).toContain("'EcclesialProfile'");
    expect(applicantWorkflows).toContain("'BAPStatus'");
    expect(interviewWorkflows).toContain('serializeAuditFields');
    expect(interviewWorkflows).toContain('serializeAuditScalar');
    expect(interviewWorkflows).toContain('applicantId:');
    expect(interviewWorkflows).toContain("entityType: 'Interview'");
  });
});
