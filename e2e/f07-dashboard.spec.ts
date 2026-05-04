import { test, expect, type Page } from '@playwright/test';

// Chart-heavy pages can stream slowly — increase per-test timeout
test.setTimeout(60_000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function devLogin(page: Page, buttonName: RegExp) {
  await page.goto('/dev/login');
  await page.getByRole('button', { name: buttonName }).click();
  // The signIn callback navigates to a staff page which streams heavily (Recharts).
  // Wait only for the URL to change away from /dev/login, then for DOM to be ready.
  await page.waitForURL((url) => !url.pathname.includes('/dev/login'), { timeout: 45_000, waitUntil: 'domcontentloaded' });
}

async function loginAsAlice(page: Page) {
  await devLogin(page, /admissions staff/i);
}

async function loginAsCarol(page: Page) {
  await devLogin(page, /senior leadership/i);
}

async function loginAsBob(page: Page) {
  await devLogin(page, /academic staff/i);
}

/** Navigate to a page, using domcontentloaded to avoid Recharts streaming stalls. */
async function navigateTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // Wait for main content to hydrate
  await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });
}

// ─── US-01: Admissions Dashboard — Display Totals ────────────────────────────

test.describe('US-01: Dashboard loads with KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    // loginAsAlice lands on /dashboard already — just wait for content
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });
  });

  test('dashboard page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /admissions dashboard/i })).toBeVisible();
  });

  test('displays all 6 KPI metric cards', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Enquiries')).toBeVisible();
    await expect(main.getByText('Interviews')).toBeVisible();
    await expect(main.getByText('Offers')).toBeVisible();
    await expect(main.getByText('Registrations')).toBeVisible();
    await expect(main.getByText('Ordinands')).toBeVisible();
    await expect(main.getByText('Accommodation', { exact: true })).toBeVisible();
  });

  test('pipeline chart renders', async ({ page }) => {
    await expect(page.getByText('Pipeline by Status')).toBeVisible();
  });

  test('accommodation summary is visible', async ({ page }) => {
    await expect(page.getByText('Accommodation Breakdown')).toBeVisible();
    await expect(page.getByText('Term-time')).toBeVisible();
    await expect(page.getByText('Full-year')).toBeVisible();
  });

  test('diocese distribution chart visible', async ({ page }) => {
    await expect(page.getByText('Diocese Distribution')).toBeVisible();
  });

  test('BAP status summary visible', async ({ page }) => {
    await expect(page.getByText('BAP Status Summary')).toBeVisible();
  });
});

// ─── US-02: Dashboard Filters ────────────────────────────────────────────────

test.describe('US-02: Dashboard filter controls', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });
    // Wait for the filter bar to be hydrated with options
    await page.locator('[data-testid="dashboard-filter-bar"]').waitFor({ state: 'visible', timeout: 10_000 });
    const yearSelect = page.locator('select[aria-label="Admissions Year"]');
    await yearSelect.waitFor({ state: 'visible', timeout: 10_000 });
    // Ensure options beyond the placeholder have loaded (hydration complete)
    await expect(yearSelect.locator('option')).not.toHaveCount(0, { timeout: 10_000 });
  });

  test('filter dropdowns are present', async ({ page }) => {
    const filterBar = page.locator('[data-testid="dashboard-filter-bar"]');
    await expect(filterBar).toBeVisible();
    await expect(filterBar.locator('select[aria-label="Admissions Year"]')).toBeVisible();
    await expect(filterBar.locator('select[aria-label="Programme"]')).toBeVisible();
    await expect(filterBar.locator('select[aria-label="Diocese"]')).toBeVisible();
    await expect(filterBar.locator('select[aria-label="Status"]')).toBeVisible();
  });

  /**
   * Helper: select a year option. Uses selectOption, then retries once if the URL
   * doesn't update (React controlled component race under parallel test load).
   */
  async function selectYear(page: Page): Promise<string> {
    const yearSelect = page.locator('select[aria-label="Admissions Year"]');
    const options = yearSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);
    const yearValue = await options.nth(1).getAttribute('value');

    // Attempt selection — retry once if onChange didn't fire (controlled component race)
    for (let attempt = 0; attempt < 2; attempt++) {
      await yearSelect.selectOption(yearValue!);
      try {
        await expect(page).toHaveURL(/admissionsYearId=/, { timeout: 8_000 });
        return yearValue!;
      } catch {
        if (attempt === 1) throw new Error('Filter select did not update URL after retry');
        // Brief wait for React hydration then retry
        await page.waitForTimeout(500);
      }
    }
    return yearValue!;
  }

  test('applying a year filter updates the URL', async ({ page }) => {
    await selectYear(page);
    expect(page.url()).toContain('admissionsYearId=');
  });

  test('clear filters button resets all filters', async ({ page }) => {
    await selectYear(page);

    const clearBtn = page.locator('[data-testid="clear-filters"]');
    await clearBtn.click();

    // The transition may take time since the dashboard re-renders with charts
    await expect(page).toHaveURL(/\/dashboard\??$/, { timeout: 30_000 });
    expect(page.url()).not.toContain('admissionsYearId=');
  });

  test('filter persists on reload', async ({ page }) => {
    const yearValue = await selectYear(page);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('select[aria-label="Admissions Year"]').waitFor({ state: 'visible', timeout: 10_000 });

    expect(page.url()).toContain('admissionsYearId=');
    const selectedValue = await page.locator('select[aria-label="Admissions Year"]').inputValue();
    expect(selectedValue).toBe(yearValue);
  });
});

// ─── US-03: Reports page + Pipeline Report ───────────────────────────────────

test.describe('US-03: Reports page and Pipeline Report', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test('navigating to /reports redirects to /reports/pipeline', async ({ page }) => {
    await navigateTo(page, '/reports');
    await page.waitForURL(/\/reports\/pipeline/, { timeout: 10_000 });
    expect(page.url()).toContain('/reports/pipeline');
  });

  test('reports sidebar navigation is visible with all 6 report links', async ({ page }) => {
    await navigateTo(page, '/reports/pipeline');
    await expect(page.getByRole('navigation', { name: /report navigation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pipeline' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Diocese Distribution' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'BAP Status' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Offers vs Registrations' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accommodation Demand' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Missing Documents' })).toBeVisible();
  });

  test('pipeline report shows heading and programme breakdown table', async ({ page }) => {
    await navigateTo(page, '/reports/pipeline');
    await expect(page.getByText('Admissions Pipeline')).toBeVisible();
    await expect(page.getByText('Breakdown by Programme')).toBeVisible();
  });

  test('pipeline report has Export CSV button', async ({ page }) => {
    await navigateTo(page, '/reports/pipeline');
    await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible();
  });
});

// ─── US-04: Diocese Distribution Report ──────────────────────────────────────

test.describe('US-04: Diocese Distribution Report', () => {
  test('displays diocese heading and table headers', async ({ page }) => {
    await loginAsAlice(page);
    await navigateTo(page, '/reports/diocese');
    await expect(page.getByRole('heading', { name: 'Diocese Distribution' })).toBeVisible();
    const main = page.locator('main');
    await expect(main.getByRole('columnheader', { name: 'Applicants' })).toBeVisible();
    await expect(main.getByRole('columnheader', { name: 'Confirmed Ordinands' })).toBeVisible();
  });
});

// ─── US-05: BAP Status Report ────────────────────────────────────────────────

test.describe('US-05: BAP Status Report', () => {
  test('displays BAP distribution table with Stage 1 and Stage 2 columns', async ({ page }) => {
    await loginAsAlice(page);
    await navigateTo(page, '/reports/bap-status');
    await expect(page.getByRole('heading', { name: 'BAP Status' })).toBeVisible();
    const main = page.locator('main');
    await expect(main.getByRole('columnheader', { name: 'Stage 1', exact: true })).toBeVisible();
    await expect(main.getByRole('columnheader', { name: 'Stage 2', exact: true })).toBeVisible();
  });
});

// ─── US-06: Offers vs Registrations Report ───────────────────────────────────

test.describe('US-06: Offers vs Registrations Report', () => {
  test('displays funnel KPI cards', async ({ page }) => {
    await loginAsAlice(page);
    await navigateTo(page, '/reports/offers-registrations');
    await expect(page.getByRole('heading', { name: 'Offers vs Registrations' })).toBeVisible();
    const main = page.locator('main');
    await expect(main.getByText('Conditional', { exact: true })).toBeVisible();
    await expect(main.getByText('Unconditional', { exact: true })).toBeVisible();
    await expect(main.getByText('Accepted', { exact: true })).toBeVisible();
    await expect(main.getByText('Confirmed', { exact: true })).toBeVisible();
  });
});

// ─── US-07: Accommodation Demand Report ──────────────────────────────────────

test.describe('US-07: Accommodation Demand Report', () => {
  test('displays accommodation KPI cards and per-applicant table', async ({ page }) => {
    await loginAsAlice(page);
    await navigateTo(page, '/reports/accommodation');
    await expect(page.getByRole('heading', { name: 'Accommodation Demand' })).toBeVisible();
    const main = page.locator('main');
    await expect(main.getByText('Total Demand')).toBeVisible();
    await expect(main.getByText('Single Rooms')).toBeVisible();
    await expect(main.getByText('Family Units')).toBeVisible();
  });
});

// ─── US-08: Missing Documents Report ─────────────────────────────────────────

test.describe('US-08: Missing Documents Report', () => {
  test('displays missing documents heading', async ({ page }) => {
    await loginAsAlice(page);
    await navigateTo(page, '/reports/missing-documents');
    await expect(page.getByRole('heading', { name: 'Missing Documents' })).toBeVisible();
  });
});

// ─── US-09: CSV Export for All Reports ───────────────────────────────────────

test.describe('US-09: CSV Export buttons visible on all reports', () => {
  const reportPaths = [
    '/reports/pipeline',
    '/reports/diocese',
    '/reports/bap-status',
    '/reports/offers-registrations',
    '/reports/accommodation',
    '/reports/missing-documents',
  ];

  for (const path of reportPaths) {
    test(`Export CSV button on ${path}`, async ({ page }) => {
      await loginAsAlice(page);
      await navigateTo(page, path);
      await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible();
    });
  }

  test('Dashboard has Export All button', async ({ page }) => {
    await loginAsAlice(page);
    // loginAsAlice already lands on /dashboard
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });
    await expect(page.getByRole('button', { name: /export all/i })).toBeVisible();
  });
});

// ─── US-10: Role-Based Dashboard Access ──────────────────────────────────────

test.describe('US-10: Role-based access control', () => {
  test('SENIOR_LEADERSHIP can access dashboard', async ({ page }) => {
    await loginAsCarol(page);
    // Carol lands on /dashboard
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /admissions dashboard/i })).toBeVisible();
    await expect(page.getByText('Enquiries')).toBeVisible();
  });

  test('SENIOR_LEADERSHIP can access reports', async ({ page }) => {
    await loginAsCarol(page);
    await navigateTo(page, '/reports');
    await page.waitForURL(/\/reports\/pipeline/, { timeout: 10_000 });
    await expect(page.getByText('Admissions Pipeline')).toBeVisible();
  });

  test('SENIOR_LEADERSHIP sees no mutation controls on dashboard', async ({ page }) => {
    await loginAsCarol(page);
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });
    const buttons = page.locator('main').getByRole('button');
    const buttonCount = await buttons.count();
    for (let i = 0; i < buttonCount; i++) {
      const text = (await buttons.nth(i).textContent()) ?? '';
      expect(text).not.toMatch(/^(add|edit|delete|create)\b/i);
    }
  });

  test('unauthenticated user is redirected to login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user is redirected to login from /reports', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('ACADEMIC_STAFF is blocked from /dashboard', async ({ page }) => {
    await loginAsBob(page);
    await navigateTo(page, '/dashboard');
    await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 10_000 });
  });

  test('ACADEMIC_STAFF is blocked from /reports', async ({ page }) => {
    await loginAsBob(page);
    await navigateTo(page, '/reports');
    await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 10_000 });
  });
});
