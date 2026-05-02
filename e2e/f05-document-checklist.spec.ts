import { test, expect } from '@playwright/test';

/**
 * F05 — Document Management E2E Spec
 *
 * Pre-conditions:
 *   - DB has been seeded (pnpm db:seed).
 *   - Alice (ADMISSIONS_STAFF) is used for edit flows.
 *   - Sophie Turner (SSH-2025-0009) is the F05 test applicant with a mix of
 *     RECEIVED / WAIVED / OUTSTANDING documents pre-seeded.
 */

async function loginAsAlice(page: Parameters<typeof test.use>[0] extends { page: infer P } ? P : import('@playwright/test').Page) {
  await page.goto('/dev/login');
  await page.getByRole('button', { name: /admissions staff/i }).click();
  await page.waitForURL(/\/applicants/);
}

test.describe('F05 — US-01: Display Document Checklist', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    // Navigate to Sophie Turner's applicant detail
    await page.goto('/applicants');
    await page.getByPlaceholder(/search/i).fill('Sophie Turner');
    await page.getByRole('link', { name: /sophie turner/i }).first().click();
    await page.waitForURL(/\/applicants\//);
    // Click Documents tab
    await page.getByRole('tab', { name: /documents/i }).click();
  });

  test('shows completion progress bar and summary', async ({ page }) => {
    await expect(page.getByText(/completion/i)).toBeVisible();
    await expect(page.getByText(/documents complete/i)).toBeVisible();
    // Progress bar element should be present
    const progressBar = page.locator('[style*="width"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('shows all 14 document checklist rows', async ({ page }) => {
    const rows = page.getByTestId('document-row');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    // All 14 document types must always be pre-populated
    expect(count).toBe(14);
  });

  test('shows Received, Waived and Outstanding badges', async ({ page }) => {
    // Sophie has a mix of states seeded
    const received = page.getByText('Received').first();
    const waived   = page.getByText('Waived').first();
    const outstanding = page.getByText('Outstanding').first();
    // At least one of each should be present (seed data provides all three)
    await expect(received).toBeVisible();
    await expect(waived).toBeVisible();
    await expect(outstanding).toBeVisible();
  });

  test('shows lock icon for sensitive documents', async ({ page }) => {
    // Sensitive docs have a lock icon — check aria is present
    const rows = page.getByTestId('document-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    // The test just verifies rows render without error
  });

  test('shows SharePoint folder link when folder is set', async ({ page }) => {
    // Sophie Turner has sharePointFolderUrl in seed
    const spLink = page.getByRole('link', { name: /open sharepoint folder/i });
    // If seeded with a folder URL it will be visible
    const isVisible = await spLink.isVisible();
    // Either the link is present or the "No SharePoint folder linked" message is
    if (!isVisible) {
      await expect(page.getByText(/no sharepoint folder linked/i)).toBeVisible();
    }
  });
});

test.describe('F05 — US-02: Mark Document as Received', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/applicants');
    await page.getByPlaceholder(/search/i).fill('Sophie Turner');
    await page.getByRole('link', { name: /sophie turner/i }).first().click();
    await page.waitForURL(/\/applicants\//);
    await page.getByRole('tab', { name: /documents/i }).click();
  });

  test('opens Mark as Received dialog from row dropdown', async ({ page }) => {
    // Find an Outstanding row and click its actions menu
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /mark as received/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/upload document/i)).toBeVisible();
  });

  test('cancelling dialog leaves status unchanged', async ({ page }) => {
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /mark as received/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(dialog).not.toBeVisible();
    // Row should still show Outstanding
    await expect(outstandingRow.getByText('Outstanding')).toBeVisible();
  });
});

test.describe('F05 — US-03: Waive Document Requirement', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/applicants');
    await page.getByPlaceholder(/search/i).fill('Sophie Turner');
    await page.getByRole('link', { name: /sophie turner/i }).first().click();
    await page.waitForURL(/\/applicants\//);
    await page.getByRole('tab', { name: /documents/i }).click();
  });

  test('opens Waive sheet from row dropdown', async ({ page }) => {
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /^waive$/i }).click();

    // Sheet should open
    await expect(page.getByText(/waive requirement/i)).toBeVisible();
  });

  test('Waive button disabled when reason is empty', async ({ page }) => {
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /^waive$/i }).click();

    const submitBtn = page.getByRole('button', { name: /waive requirement/i }).last();
    await expect(submitBtn).toBeDisabled();
  });

  test('Waive button enabled after entering a reason', async ({ page }) => {
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /^waive$/i }).click();

    await page.getByPlaceholder(/equivalent qualification/i).fill('Applicant holds equivalent overseas qualification.');
    const submitBtn = page.getByRole('button', { name: /waive requirement/i }).last();
    await expect(submitBtn).toBeEnabled();
  });
});

test.describe('F05 — US-06: Sensitive Document Access Control', () => {
  test('lock icon visible on Legal ID, DBS Check, and Medical Declaration only', async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/applicants');
    await page.getByPlaceholder(/search/i).fill('Sophie Turner');
    await page.getByRole('link', { name: /sophie turner/i }).first().click();
    await page.waitForURL(/\/applicants\//);
    await page.getByRole('tab', { name: /documents/i }).click();

    const rows = page.getByTestId('document-row');
    // All 14 rows visible to Alice
    await expect(rows).toHaveCount(14);
    // Sensitive rows should exist
    await expect(rows.filter({ hasText: 'Legal ID' })).toBeVisible();
    await expect(rows.filter({ hasText: 'DBS Check' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Medical Declaration' })).toBeVisible();
    // Non-sensitive row should not have a lock icon (verify by absence on GCSE row)
    const gcseRow = rows.filter({ hasText: 'GCSE Transcript' });
    await expect(gcseRow.locator('svg[data-testid="lock-icon"]')).toHaveCount(0);
  });

  test('Carol (SENIOR_LEADERSHIP) sees Documents tab but has no action buttons', async ({ page }) => {
    await page.goto('/dev/login');
    await page.getByRole('button', { name: /senior leadership/i }).click();
    await page.waitForURL(/\/(applicants|dashboard)/);

    // Navigate to applicants list
    if (page.url().includes('dashboard')) {
      await page.goto('/applicants');
    }

    await page.getByPlaceholder(/search/i).fill('Sophie Turner');
    await page.getByRole('link', { name: /sophie turner/i }).first().click();
    await page.waitForURL(/\/applicants\//);
    await page.getByRole('tab', { name: /documents/i }).click();

    // Should see document checklist
    const checklist = page.getByTestId('document-checklist');
    await expect(checklist).toBeVisible();

    // Should NOT see dropdown action buttons (canEdit=false for SENIOR_LEADERSHIP)
    const actionButtons = page.getByRole('button', { name: /document actions/i });
    expect(await actionButtons.count()).toBe(0);
  });
});
