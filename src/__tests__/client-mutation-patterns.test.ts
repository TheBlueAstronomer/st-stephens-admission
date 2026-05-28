import { describe, expect, it } from 'vitest';

describe('Rank 8 shared client mutation pattern regressions', () => {
  it('defines a shared action executor hook', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const hookPath = path.resolve(__dirname, '../hooks/use-action-executor.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');

    expect(fs.existsSync(hookPath)).toBe(true);
    expect(content).toContain('export function useActionExecutor()');
    expect(content).toContain('const [isPending, startTransition] = useTransition();');
    expect(content).toContain('router.refresh();');
    expect(content).toContain('toast.success(message);');
    expect(content).toContain('toast.error(message);');
  });

  it('rank 8 components use the shared action executor instead of local orchestration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const targetPaths = [
      path.resolve(__dirname, '../features/applicants/components/applicant-detail-view.tsx'),
      path.resolve(__dirname, '../features/interviews/components/interview-detail-view.tsx'),
      path.resolve(__dirname, '../features/interviews/components/use-schedule-interview-dialog.ts'),
      path.resolve(__dirname, '../features/applicants/components/detail/tabs.tsx'),
    ];

    for (const targetPath of targetPaths) {
      const content = fs.readFileSync(targetPath, 'utf-8');
      expect(content).toContain("from '@/hooks/use-action-executor'");
      expect(content).toContain('executeAction({');
      expect(content).not.toContain('startTransition(async () =>');
    }
  });
});
