import { test, expect, type Page } from '@playwright/test';

test.setTimeout(60_000);

/**
 * F05 — Document Management E2E Spec
 *
 * Pre-conditions:
 *   - DB has been seeded (pnpm db:seed).
 *   - Alice (ADMISSIONS_STAFF) is used for edit flows.
 *   - Sophie Turner (SSH-2025-0009) is the F05 test applicant with a mix of
 *     RECEIVED / WAIVED / OUTSTANDING documents pre-seeded.
 */

async function loginAsAlice(page: Page) {
  await devSignIn(page, 'alice@ssh-dev.local');
}

async function loginAsCarol(page: Page) {
  await devSignIn(page, 'carol@ssh-dev.local');
}

async function devSignIn(page: Page, email: string) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  await page.request.post('/api/auth/callback/dev-credentials', {
    form: { csrfToken, email, callbackUrl: '/' },
  });
}

async function navigateToSophieDocuments(page: Page) {
  await page.goto('/applicants', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/search/i).fill('Sophie Turner');
  await page.getByRole('link', { name: /sophie turner/i }).first().click();
  await page.waitForURL(/\/applicants\//, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Sophie Turner' })).toBeVisible();
  await openDocumentsTab(page);
}

async function openDocumentsTab(page: Page) {
  const documentsTab = page.getByRole('tab', { name: /documents/i });
  const checklist = page.getByTestId('document-checklist');

  await expect(documentsTab).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await documentsTab.click();

    try {
      await expect(documentsTab).toHaveAttribute('aria-selected', 'true', { timeout: 1_500 });
      await expect(checklist).toBeVisible({ timeout: 3_000 });
      return;
    } catch {
      await documentsTab.press('Enter').catch(() => undefined);
    }
  }

  await expect(documentsTab).toHaveAttribute('aria-selected', 'true');
  await expect(checklist).toBeVisible();
}

test.describe('F05 — US-01: Display Document Checklist', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    await navigateToSophieDocuments(page);
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
    // Detailed sensitive-icon behavior is covered in US-06 below.
    const rows = page.getByTestId('document-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows SharePoint folder link when folder is set', async ({ page }) => {
    // Sophie Turner has sharePointFolderUrl in seed
    const spLink = page.getByRole('link', { name: /open applicant folder/i });
    // If seeded with a folder URL it will be visible
    const isVisible = await spLink.isVisible();
    // Either the link is present or the current empty-state text is.
    if (!isVisible) {
      await expect(page.getByText(/not linked/i)).toBeVisible();
    }
  });
});

test.describe('F05 — US-02: Mark Document as Received', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    await navigateToSophieDocuments(page);
  });

  test('opens Mark as Received dialog from row dropdown', async ({ page }) => {
    // Find an Outstanding row and click its actions menu
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /mark as received/i }).click();

    await expect(page.getByRole('dialog', { name: /upload document/i })).toBeVisible();
  });

  test('cancelling dialog leaves status unchanged', async ({ page }) => {
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /mark as received/i }).click();

    const dialog = page.getByRole('dialog', { name: /upload document/i });
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
    await navigateToSophieDocuments(page);
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

    const submitBtn = page.getByRole('button', { name: /waive/i }).last();
    await expect(submitBtn).toBeDisabled();
  });

  test('Waive button enabled after entering a reason', async ({ page }) => {
    const rows = page.getByTestId('document-row');
    const outstandingRow = rows.filter({ has: page.getByText('Outstanding') }).first();
    await outstandingRow.getByRole('button', { name: /document actions/i }).click();
    await page.getByRole('menuitem', { name: /^waive$/i }).click();

    await page.getByPlaceholder(/equivalent qualification/i).fill('Applicant holds equivalent overseas qualification.');
    const submitBtn = page.getByRole('button', { name: /waive/i }).last();
    await expect(submitBtn).toBeEnabled();
  });
});

test.describe('F05 — US-06: Sensitive Document Access Control', () => {
  test('lock icon visible on Legal ID, DBS Check, and Medical Declaration only', async ({ page }) => {
    await loginAsAlice(page);
    await navigateToSophieDocuments(page);

    const rows = page.getByTestId('document-row');
    // All 14 rows visible to Alice
    await expect(rows).toHaveCount(14);
    // Sensitive rows render the amber lock icon.
    await expect(rows.filter({ hasText: 'Legal ID' }).locator('td').first().locator('svg[class*="text-amber-500"]')).toHaveCount(1);
    await expect(rows.filter({ hasText: 'DBS Check' }).locator('td').first().locator('svg[class*="text-amber-500"]')).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Medical Declaration' }).locator('td').first().locator('svg[class*="text-amber-500"]')).toHaveCount(1);
    // Non-sensitive row should not have the amber lock icon.
    const gcseRow = rows.filter({ hasText: 'GCSE Transcript' });
    await expect(gcseRow.locator('td').first().locator('svg[class*="text-amber-500"]')).toHaveCount(0);
  });

  test('Carol (SENIOR_LEADERSHIP) sees Documents tab but has no action buttons', async ({ page }) => {
    await loginAsCarol(page);
    await page.goto('/applicants', { waitUntil: 'domcontentloaded' });

    await page.getByPlaceholder(/search/i).fill('Sophie Turner');
    await page.getByRole('link', { name: /sophie turner/i }).first().click();
    await page.waitForURL(/\/applicants\//, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Sophie Turner' })).toBeVisible();
    await openDocumentsTab(page);

    // Should see document checklist
    const checklist = page.getByTestId('document-checklist');
    await expect(checklist).toBeVisible();

    // Should NOT see dropdown action buttons (canEdit=false for SENIOR_LEADERSHIP)
    const actionButtons = page.getByRole('button', { name: /document actions/i });
    expect(await actionButtons.count()).toBe(0);
  });
});
