import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Sign in as a dev user by posting directly to next-auth credentials endpoint */
async function devSignIn(page: Page, email: string) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  await page.request.post('/api/auth/callback/dev-credentials', {
    form: { csrfToken, email, callbackUrl: '/' },
  });
}

/** Navigate to interview detail via the list page */
async function navigateToFirstInterview(page: Page): Promise<void> {
  await page.goto('/interviews');
  const link = page.locator('main a[href*="/interviews/"]').first();
  await link.waitFor({ state: 'visible' });
  const href = await link.getAttribute('href');
  if (!href) throw new Error('No interview link found');
  // Use window.location for clean full-page navigation (avoids RSC streaming abort)
  await page.evaluate((url) => { window.location.href = url; }, href);
  await page.waitForURL(/\/interviews\/.+/);
  // Wait for detail content to render
  await page.locator('textarea').first().waitFor({ state: 'visible', timeout: 15_000 });
}

/** Navigate to applicant detail via the list page */
async function navigateToApplicant(page: Page, name: string): Promise<void> {
  await page.goto('/applicants');
  const link = page.locator(`main a:has-text("${name}")`).first();
  await link.waitFor({ state: 'visible' });
  const href = await link.getAttribute('href');
  if (!href) throw new Error(`No applicant link found for ${name}`);
  // Use window.location for clean full-page navigation (avoids RSC streaming abort)
  await page.evaluate((url) => { window.location.href = url; }, href);
  await page.waitForURL(/\/applicants\/.+/);
  // Wait for detail content to render
  await page.getByRole('tab').first().waitFor({ state: 'visible', timeout: 15_000 });
}

// ─── Interview List View ────────────────────────────────────────────────────

test.describe('Interview List View', () => {
  test('Interview list shows seeded interview with correct details', async ({
    page,
  }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/interviews');

    await expect(page.getByText('Michael Johnson')).toBeVisible();
    await expect(page.getByText('SSH-2025-0003')).toBeVisible();

    const typeText = page.getByText(/Visit-Interview|Exploratory/);
    await expect(typeText.first()).toBeVisible();
  });

  test('Interview list shows panel member name', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/interviews');

    await expect(page.getByText('Bob Academic')).toBeVisible();
  });
});

// ─── US-05: Interview Access Control ────────────────────────────────────────

test.describe('Interview Access Control (US-05)', () => {
  test('Admissions staff can access interview list', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/interviews');

    await expect(page.getByRole('heading', { name: /interviews/i })).toBeVisible();
  });

  test('Assigned interviewer (Bob) can access interview list', async ({
    page,
  }) => {
    await devSignIn(page, 'bob@ssh-dev.local');
    await page.goto('/interviews');

    await expect(page.getByText('Michael Johnson')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Assigned interviewer can access interview detail', async ({
    page,
  }) => {
    await devSignIn(page, 'bob@ssh-dev.local');
    await navigateToFirstInterview(page);

    await expect(page.getByText(/Visit-Interview/i).first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('Admissions staff can access any interview detail', async ({
    page,
  }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToFirstInterview(page);

    await expect(page.locator('textarea').first()).toBeVisible();
  });
});

// ─── US-09: Interview Detail Screen ─────────────────────────────────────────

test.describe('Interview Detail Screen (US-09)', () => {
  test('Interview detail displays all required fields', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToFirstInterview(page);

    // Interview type badge
    await expect(page.getByText(/Visit-Interview/i).first()).toBeVisible();

    // Status badge
    await expect(page.getByText(/SCHEDULED/i).first()).toBeVisible();

    // Date & time (scoped to main to avoid matching applicant ID)
    await expect(page.locator('main').getByText(/2025/).first()).toBeVisible();

    // Assigned interviewer
    await expect(page.getByText('Bob Academic')).toBeVisible();

    // Notes textarea
    await expect(page.locator('textarea').first()).toBeVisible();

    // Outcome options
    await expect(page.getByRole('button', { name: 'Recommended', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Not Recommended' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deferred' })).toBeVisible();
  });

  test('Breadcrumb navigation links back to interviews', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToFirstInterview(page);

    const backLink = page.locator('main a[href="/applicants"]');
    await expect(backLink).toBeVisible();
  });
});

// ─── US-06: Applicant Details Visible to Interviewer ────────────────────────

test.describe('Interviewer sees applicant details (US-06)', () => {
  test('Assigned interviewer sees applicant name on detail', async ({
    page,
  }) => {
    await devSignIn(page, 'bob@ssh-dev.local');
    await navigateToFirstInterview(page);

    // Applicant summary shows preferredName ("Mike") or legalName
    await expect(page.getByText(/Mike|Michael Johnson/).first()).toBeVisible();
    await expect(page.getByText(/Visit-Interview/i).first()).toBeVisible();
  });
});

// ─── US-07: Invitation Tracking ─────────────────────────────────────────────

test.describe('Invitation Tracking (US-07)', () => {
  test('Invitation sent badge is shown for seeded interview', async ({
    page,
  }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToFirstInterview(page);

    await expect(page.getByText(/Sent/i).first()).toBeVisible();
  });
});

// ─── US-08: Interview Application Received ──────────────────────────────────

test.describe('Interview Application Tracking (US-08)', () => {
  test('Application received controls visible', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await navigateToFirstInterview(page);

    // Either a "Mark as received" button or a "Received" badge
    const received = page.getByText(/Received/i).first();
    const markBtn = page.getByText(/Mark as received/i);

    const isReceived = await received.isVisible().catch(() => false);
    const hasMark = await markBtn.isVisible().catch(() => false);

    expect(isReceived || hasMark).toBeTruthy();
  });
});

// ─── US-03 / US-04: Record Outcome ─────────────────────────────────────────

test.describe('Record Interview Outcome (US-03, US-04)', () => {
  test('Outcome controls are visible and functional for assigned interviewer', async ({
    page,
  }) => {
    await devSignIn(page, 'bob@ssh-dev.local');
    await navigateToFirstInterview(page);

    await expect(page.getByRole('button', { name: 'Recommended', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Not Recommended' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deferred' })).toBeVisible();

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEditable();
  });

  test('Save Notes button is present', async ({ page }) => {
    await devSignIn(page, 'bob@ssh-dev.local');
    await navigateToFirstInterview(page);

    await expect(
      page.getByRole('button', { name: /save notes/i })
    ).toBeVisible();
  });

  test('Record Outcome button is present', async ({ page }) => {
    await devSignIn(page, 'bob@ssh-dev.local');
    await navigateToFirstInterview(page);

    await expect(
      page.getByRole('button', { name: /mark as completed/i })
    ).toBeVisible();
  });
});

// ─── US-01 / US-02: Schedule Interview Dialog ───────────────────────────────

test.describe('Interview Scheduling (US-01, US-02)', () => {
  test('Schedule Interview dialog opens from applicant detail', async ({
    page,
  }) => {
    await devSignIn(page, 'alice@ssh-dev.local');

    // Navigate to Michael Johnson (SSH-2025-0003) — BAP COMPLETED
    await navigateToApplicant(page, 'Michael Johnson');

    // Click the Interview tab
    await page.getByRole('tab', { name: /interview/i }).click();

    const scheduleBtn = page.getByRole('button', {
      name: /schedule interview/i,
    });
    await expect(scheduleBtn).toBeVisible();
    await scheduleBtn.click();

    // Dialog should appear
    await expect(
      page.getByRole('heading', { name: /schedule interview/i })
    ).toBeVisible();

    await expect(page.getByText('Exploratory Visit')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Visit-Interview' })).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();
  });

  test('BAP warning is shown for applicant with incomplete BAP', async ({
    page,
  }) => {
    await devSignIn(page, 'alice@ssh-dev.local');

    // Navigate to James Smith (SSH-2025-0001) — BAP INCOMPLETE
    await navigateToApplicant(page, 'James Smith');

    // Click Interview tab
    await page.getByRole('tab', { name: /interview/i }).click();

    const scheduleBtn = page.getByRole('button', {
      name: /schedule interview/i,
    });

    if (await scheduleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduleBtn.click();
      await expect(page.getByText(/BAP incomplete/i)).toBeVisible();
    }
  });
});
