import { describe, expect, it } from 'vitest';

describe('Rank 6 shared action result regressions', () => {
  it('defines the shared action result helpers in src/lib/action-result.ts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const sharedPath = path.resolve(__dirname, '../lib/action-result.ts');
    const content = fs.readFileSync(sharedPath, 'utf-8');

    expect(fs.existsSync(sharedPath)).toBe(true);
    expect(content).toContain('export interface ActionResult<T = void>');
    expect(content).toContain('export function actionSuccess');
    expect(content).toContain('export function actionError');
    expect(content).toContain('export function validationError');
    expect(content).toContain('export function toActionResult');
    expect(content).toContain('export function toVoidActionResult');
  });

  it('applicant and interview actions import the shared action result contract instead of defining local ones', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const applicantActionsPath = path.resolve(__dirname, '../app/(staff)/applicants/actions.ts');
    const interviewActionsPath = path.resolve(__dirname, '../app/(staff)/interviews/actions.ts');
    const applicantContent = fs.readFileSync(applicantActionsPath, 'utf-8');
    const interviewContent = fs.readFileSync(interviewActionsPath, 'utf-8');

    expect(applicantContent).toContain("from '@/lib/action-result'");
    expect(interviewContent).toContain("from '@/lib/action-result'");
    expect(applicantContent).not.toContain('export interface ActionResult');
    expect(interviewContent).not.toContain('export interface ActionResult');
    expect(applicantContent).toContain('validationError(');
    expect(interviewContent).toContain('validationError(');
  });
});
