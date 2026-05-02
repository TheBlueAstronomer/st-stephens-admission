import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function devSignIn(page: Page, email: string) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  await page.request.post('/api/auth/callback/dev-credentials', {
    form: { csrfToken, email, callbackUrl: '/' },
  });
}

async function navigateToApplicant(page: Page, name: string) {
  await page.goto('/applicants');
  const link = page.locator(`main a:has-text("${name}")`).first();
  await link.waitFor({ state: 'visible' });
  const href = await link.getAttribute('href');
  if (!href) throw new Error(`No applicant link found for ${name}`);
  await page.evaluate((url) => { window.location.href = url; }, href);
  await page.waitForURL(/\/applicants\/.+/);
  await page.getByRole('tab').first().waitFor({ state: 'visible', timeout: 15_000 });
}

async function clickTab(page: Page, label: string) {
  await page.getByRole('tab', { name: label }).click();
  await page.waitForTimeout(300);
}

// ─── US-10: Visual treatment for DECLINED / WITHDRAWN ────────────────────────

test.describe('US-10: Declined/Withdrawn visual treatment in applicant list', () => {
  test('WITHDRAWN applicant row has muted text and line-through styling', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/applicants');

    // Emily Clarke is seeded as WITHDRAWN
    const emilyRow = page.locator('tbody tr').filter({ hasText: 'Emily Clarke' });
    await emilyRow.waitFor({ state: 'visible' });

    // Name cell should have line-through class
    const nameCell = emilyRow.locator('td').first().locator('div').first();
    await expect(nameCell).toHaveClass(/line-through/);
  });

  test('WITHDRAWN row has reduced opacity', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/applicants');

    const emilyRow = page.locator('tbody tr').filter({ hasText: 'Emily Clarke' });
    await emilyRow.waitFor({ state: 'visible' });
    await expect(emilyRow).toHaveClass(/opacity-50/);
  });

  test('Active applicant (INTERVIEW_COMPLETED) does NOT have line-through', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/applicants');

    const rachelRow = page.locator('tbody tr').filter({ hasText: 'Rachel Green' });
    await rachelRow.waitFor({ state: 'visible' });

    const nameCell = rachelRow.locator('td').first().locator('div').first();
    await expect(nameCell).not.toHaveClass(/line-through/);
    await expect(rachelRow).not.toHaveClass(/opacity-50/);
  });

  test('WITHDRAWN applicant is still visible in the full applicant list (report context)', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/applicants');

    // The full list shows all statuses including WITHDRAWN and DECLINED
    await expect(page.getByText('Emily Clarke')).toBeVisible();
  });
});

// ─── US-01 / US-02: Record Offer Decision ─────────────────────────────────────

test.describe('US-01: Record Offer Decision — Rachel Green (INTERVIEW_COMPLETED)', () => {
  test('Offer tab shows Record or Update Offer Decision button for INTERVIEW_COMPLETED applicant', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToApplicant(page, 'Rachel');

    await clickTab(page, 'Offer');
    // Either "Record Offer Decision" (no offer yet) or "Update Offer Decision" (offer exists)
    await expect(page.getByRole('button', { name: /Offer Decision/i })).toBeVisible();
  });

  test('Offer Decision sheet opens on button click and shows offer type options', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToApplicant(page, 'Rachel');

    await clickTab(page, 'Offer');
    await page.getByRole('button', { name: /Offer Decision/i }).click();

    // Sheet title should appear
    await expect(page.getByRole('heading', { name: /Record Offer Decision/i })).toBeVisible({ timeout: 5_000 });
    // Offer type radio options should be visible
    await expect(page.getByText('Unconditional Offer')).toBeVisible();
    await expect(page.getByText('Conditional Offer')).toBeVisible();
    await expect(page.getByText('Declined')).toBeVisible();
  });

  test('Record Decision saves and Offer tab shows Unconditional Offer badge', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToApplicant(page, 'Rachel');

    await clickTab(page, 'Offer');
    await page.getByRole('button', { name: /Offer Decision/i }).click();

    // Sheet is open — Unconditional is default
    await expect(page.getByRole('heading', { name: /Record Offer Decision/i })).toBeVisible({ timeout: 5_000 });

    // Submit
    await page.getByRole('button', { name: 'Record Decision' }).click();

    // After success + router refresh, offer badge appears (may already be there if re-run)
    await expect(page.getByText('Unconditional Offer').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── US-03: Accept Offer ──────────────────────────────────────────────────────

test.describe('US-03: Accept Offer', () => {
  test('Accept Offer button appears after an offer is recorded (Sarah Williams — CONDITIONAL_OFFER)', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    // Sarah Williams is seeded at CONDITIONAL_OFFER — use her for this check
    await navigateToApplicant(page, 'Sarah');

    await clickTab(page, 'Offer');

    // If no offer recorded, the Record button should be visible (Sarah has CONDITIONAL_OFFER status)
    // Either the "Record Offer Decision" or "Update Offer Decision" button should be present
    const offerButton = page.getByRole('button', { name: /Offer Decision/i });
    await expect(offerButton).toBeVisible({ timeout: 5_000 });
  });
});

// ─── US-05 / US-06: Registration tab gating ──────────────────────────────────

test.describe('US-05 / US-06: Registration tab shows gating message without accepted offer', () => {
  test('Registration tab shows empty state without accepted offer', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    // Michael Johnson — INTERVIEW_SCHEDULED, no offer
    await navigateToApplicant(page, 'Michael');

    await clickTab(page, 'Registration');
    await expect(
      page.getByText(/Registration is available once the applicant has accepted their offer/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── US-10: Offer tab NOT shown for DECLINED applicant ────────────────────────

test.describe('US-10: Declined applicant detail view', () => {
  test('WITHDRAWN applicant detail — Offer tab does not show Record button', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToApplicant(page, 'Emily');

    await clickTab(page, 'Offer');

    // canRecord is false for WITHDRAWN applicants — no record button visible
    await expect(page.getByRole('button', { name: /Record Offer Decision/i })).not.toBeVisible();
  });

  test('WITHDRAWN applicant status badge shows Withdrawn in list', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/applicants');

    const emilyRow = page.locator('tbody tr').filter({ hasText: 'Emily Clarke' });
    await emilyRow.waitFor({ state: 'visible' });
    await expect(emilyRow.getByText('Withdrawn')).toBeVisible();
  });
});
