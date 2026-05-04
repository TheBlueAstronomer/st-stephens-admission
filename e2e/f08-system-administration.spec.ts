import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Sign in as a dev user via next-auth credentials endpoint */
async function devSignIn(page: Page, email: string) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  await page.request.post('/api/auth/callback/dev-credentials', {
    form: { csrfToken, email, callbackUrl: '/' },
  });
}

// Seed users:
//   alice@ssh-dev.local → ADMISSIONS_STAFF
//   bob@ssh-dev.local   → ACADEMIC_STAFF
//   carol@ssh-dev.local → SENIOR_LEADERSHIP
//   dave@ssh-dev.local  → SYSTEM_ADMINISTRATOR

// ═══════════════════════════════════════════════════════════════════════════
// US-01: Admin Screen Access Control
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-01: Admin Screen Access Control', () => {
  test('SYSTEM_ADMINISTRATOR can access /admin and sees navigation tabs', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin');
    await page.waitForURL(/\/admin/);

    // Admin nav links should be visible
    const nav = page.locator('nav[aria-label="Admin navigation"]');
    await expect(nav).toBeVisible({ timeout: 10_000 });

    await expect(nav.getByText('Users')).toBeVisible();
    await expect(nav.getByText('Programmes')).toBeVisible();
    await expect(nav.getByText('Dioceses')).toBeVisible();
    await expect(nav.getByText('Document Types')).toBeVisible();
    await expect(nav.getByText('Admissions Years')).toBeVisible();
    await expect(nav.getByText('Audit Log')).toBeVisible();
  });

  test('ADMISSIONS_STAFF is blocked from /admin (sees forbidden page)', async ({ page }) => {
    await devSignIn(page, 'alice@ssh-dev.local');
    await page.goto('/admin');

    await expect(page.getByText('Access Denied')).toBeVisible({ timeout: 10_000 });
  });

  test('ACADEMIC_STAFF is blocked from /admin', async ({ page }) => {
    await devSignIn(page, 'bob@ssh-dev.local');
    await page.goto('/admin');

    await expect(page.getByText('Access Denied')).toBeVisible({ timeout: 10_000 });
  });

  test('SENIOR_LEADERSHIP is blocked from /admin', async ({ page }) => {
    await devSignIn(page, 'carol@ssh-dev.local');
    await page.goto('/admin');

    await expect(page.getByText('Access Denied')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-02: Create Staff User — User Management
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-02: User Management', () => {
  test('Admin sees user management table with seeded users', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/users');

    // Wait for the table to render
    // Scope to the table to avoid matching sidebar user button text
    const table = page.locator('table');
    await expect(table.getByRole('cell', { name: 'Alice Admissions' })).toBeVisible({ timeout: 10_000 });
    await expect(table.getByRole('cell', { name: 'Bob Academic' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Carol Leadership' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Dave Admin' })).toBeVisible();
  });

  test('Invite User dialog opens and has required fields', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /invite user/i }).click();

    // Dialog should be visible
    await expect(page.getByRole('heading', { name: /invite staff user/i })).toBeVisible({ timeout: 5_000 });

    // Form fields
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/role/i)).toBeVisible();

    // Create button
    await expect(page.getByRole('button', { name: /create user/i })).toBeVisible();
  });

  test('User table has search filter and role filter', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/users');

    // Search input
    const searchInput = page.getByPlaceholder(/search name or email/i);
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Role filter
    const roleFilter = page.locator('select[aria-label="Filter by role"]');
    await expect(roleFilter).toBeVisible();

    // Status filter
    const statusFilter = page.locator('select[aria-label="Filter by status"]');
    await expect(statusFilter).toBeVisible();
  });

  test('Role and status badges display for users', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/users');

    // Scope to table to avoid matching hidden <option> elements
    const table = page.locator('table');
    await expect(table.getByText('Admissions Staff').first()).toBeVisible({ timeout: 10_000 });
    await expect(table.getByText('Active').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-03/US-04: User Deactivation and Role Change — via dropdown menu
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-03/US-04: User Actions (Deactivate, Role Change)', () => {
  test('User row has actions dropdown with Deactivate and role change options', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/users');

    // Wait for table to render
    await expect(page.getByText('Alice Admissions')).toBeVisible({ timeout: 10_000 });

    // Find Alice's row and click its dropdown trigger
    const aliceRow = page.locator('tbody tr').filter({ hasText: 'Alice Admissions' });
    await aliceRow.locator('button[data-slot="dropdown-menu-trigger"]').click();

    // Dropdown items should appear
    await expect(page.getByText('Deactivate')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Set as Academic Staff/i)).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-05: Manage Academic Programmes
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-05: Manage Academic Programmes', () => {
  test('Programmes page shows seeded programmes', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/programmes');

    await expect(page.getByRole('heading', { name: /programmes/i })).toBeVisible({ timeout: 10_000 });

    // Table headers
    await expect(page.getByText('Course Title')).toBeVisible();
    await expect(page.getByText('Framework')).toBeVisible();
    await expect(page.getByText('Mode')).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();

    // Seeded programmes (from seed.ts)
    await expect(page.getByText('BA in Theology').first()).toBeVisible();
  });

  test('New Programme button opens creation sheet', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/programmes');

    await page.getByRole('button', { name: /new programme/i }).click();

    // Sheet header
    await expect(page.getByRole('heading', { name: /new programme/i })).toBeVisible({ timeout: 5_000 });

    // Form fields
    await expect(page.getByLabel(/course title/i)).toBeVisible();
    // NativeSelect labels may not be associated via for/id; check by text
    await expect(page.getByText(/framework/i).first()).toBeVisible();
    await expect(page.getByText(/mode/i).first()).toBeVisible();

    // Create button
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('Programme row has dropdown with Edit and Deactivate options', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/programmes');

    // Wait for table
    await expect(page.getByText('BA in Theology').first()).toBeVisible({ timeout: 10_000 });

    const row = page.locator('tbody tr').first();
    await row.locator('button[data-slot="dropdown-menu-trigger"]').click();

    await expect(page.getByText('Edit')).toBeVisible({ timeout: 5_000 });
    // Either Deactivate or Reactivate depending on programme state
    const deactivate = page.getByText('Deactivate');
    const reactivate = page.getByText('Reactivate');
    const hasDeactivate = await deactivate.isVisible().catch(() => false);
    const hasReactivate = await reactivate.isVisible().catch(() => false);
    expect(hasDeactivate || hasReactivate).toBeTruthy();
  });

  test('Active programmes show Active badge', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/programmes');

    await expect(page.getByText('Active').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-06: Manage Dioceses
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-06: Manage Dioceses', () => {
  test('Dioceses page shows seeded dioceses', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/dioceses');

    await expect(page.getByRole('heading', { name: /dioceses/i })).toBeVisible({ timeout: 10_000 });

    // Seeded dioceses
    await expect(page.getByText('Oxford').first()).toBeVisible();
    await expect(page.getByText('London').first()).toBeVisible();
    await expect(page.getByText('Canterbury').first()).toBeVisible();
  });

  test('Add Diocese button is visible', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/dioceses');

    await expect(page.getByRole('button', { name: /add diocese/i })).toBeVisible({ timeout: 10_000 });
  });

  test('Clicking Add Diocese shows inline input row', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/dioceses');

    await page.getByRole('button', { name: /add diocese/i }).click();

    // New row input should appear
    const input = page.getByPlaceholder('Diocese name');
    await expect(input).toBeVisible({ timeout: 5_000 });
    await expect(input).toBeFocused();
  });

  test('Diocese search filter works', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/dioceses');

    await expect(page.getByText('Oxford').first()).toBeVisible({ timeout: 10_000 });

    // Type a search term
    const search = page.getByPlaceholder('Search...');
    await search.fill('Oxford');

    // Oxford should remain, London should be hidden
    await expect(page.getByText('Oxford').first()).toBeVisible();
    // The Applicants column might show "London" as text in another context,
    // but the diocese row for London should be hidden
    const londonRow = page.locator('tbody tr').filter({ hasText: 'London' });
    await expect(londonRow).toHaveCount(0);
  });

  test('Edit pencil icon is visible for each diocese', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/dioceses');

    await expect(page.getByText('Oxford').first()).toBeVisible({ timeout: 10_000 });

    // Each row should have an edit button
    const editButtons = page.locator('tbody tr button').filter({ has: page.locator('svg') });
    const count = await editButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-07: Configure Document Types
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-07: Configure Document Types', () => {
  test('Document Types page shows seeded types', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/document-types');

    await expect(page.getByRole('heading', { name: /document types/i })).toBeVisible({ timeout: 10_000 });

    // Table columns
    await expect(page.getByText('Name', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Key').first()).toBeVisible();
    await expect(page.getByText('Required').first()).toBeVisible();
    await expect(page.getByText('Sensitive').first()).toBeVisible();
  });

  test('New Document Type button opens creation sheet', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/document-types');

    await page.getByRole('button', { name: /new document type/i }).click();

    // Sheet header
    await expect(page.getByRole('heading', { name: /new document type/i })).toBeVisible({ timeout: 5_000 });

    // Form fields
    await expect(page.getByLabel(/display name/i)).toBeVisible();
    await expect(page.getByLabel(/internal key/i)).toBeVisible();
    await expect(page.getByText(/required for all applicants/i)).toBeVisible();
    await expect(page.getByText(/contains sensitive data/i)).toBeVisible();

    // Create button
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('Document type row has dropdown with Edit and Deactivate', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/document-types');

    // Wait for first row
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    const row = page.locator('tbody tr').first();
    await row.locator('button[data-slot="dropdown-menu-trigger"]').click();

    await expect(page.getByText('Edit')).toBeVisible({ timeout: 5_000 });
    const deactivate = page.getByText('Deactivate');
    const reactivate = page.getByText('Reactivate');
    const has = (await deactivate.isVisible().catch(() => false)) || (await reactivate.isVisible().catch(() => false));
    expect(has).toBeTruthy();
  });

  test('Document types show Active/Inactive badges', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/document-types');

    await expect(page.getByText('Active').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Document type slugs are displayed as code badges', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/document-types');

    // Slugs rendered inside <code> elements
    const codeElements = page.locator('tbody code');
    await expect(codeElements.first()).toBeVisible({ timeout: 10_000 });
    const count = await codeElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-08: Manage Admissions Years
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-08: Manage Admissions Years', () => {
  test('Admissions Years page shows seeded years', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/admissions-years');

    await expect(page.getByRole('heading', { name: /admissions years/i })).toBeVisible({ timeout: 10_000 });

    // Seeded years
    await expect(page.getByText('2025-2026')).toBeVisible();
    await expect(page.getByText('2026-2027')).toBeVisible();
  });

  test('Current year is marked with star icon and Current badge', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/admissions-years');

    // 2025-2026 is the current year (seeded) — use exact match to avoid "Set Current" button
    await expect(page.getByText('Current', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('Non-current year has Set Current button', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/admissions-years');

    await expect(page.getByRole('button', { name: /set current/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('New Year button opens creation dialog', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/admissions-years');

    await page.getByRole('button', { name: /new year/i }).click();

    // Dialog header
    await expect(page.getByRole('heading', { name: /new admissions year/i })).toBeVisible({ timeout: 5_000 });

    // Form fields
    await expect(page.getByLabel(/label/i)).toBeVisible();
    await expect(page.getByLabel(/start date/i)).toBeVisible();
    await expect(page.getByLabel(/end date/i)).toBeVisible();
    await expect(page.getByText(/set as current/i)).toBeVisible();

    // Create button
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('Year table shows column headers', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/admissions-years');

    // Scope to main to avoid sidebar duplicates
    const main = page.locator('main');
    await expect(main.getByRole('columnheader', { name: 'Label' })).toBeVisible({ timeout: 10_000 });
    await expect(main.getByRole('columnheader', { name: 'Start' })).toBeVisible();
    await expect(main.getByRole('columnheader', { name: 'End' })).toBeVisible();
    await expect(main.getByRole('columnheader', { name: 'Applicants' })).toBeVisible();
    await expect(main.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-09: Audit Log Viewer
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-09: Audit Log Viewer', () => {
  test('Audit log page renders table with columns', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/audit-log');

    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible({ timeout: 10_000 });

    // Column headers
    await expect(page.getByText('Timestamp')).toBeVisible();
    await expect(page.getByText('Action', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Entity')).toBeVisible();
    await expect(page.getByText('Performed By')).toBeVisible();
    await expect(page.getByText('Details')).toBeVisible();
  });

  test('Audit log has filter dropdowns', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/audit-log');

    // Filter selects
    const actionFilter = page.locator('select[aria-label="Filter by action"]');
    const entityFilter = page.locator('select[aria-label="Filter by entity type"]');
    const userFilter = page.locator('select[aria-label="Filter by user"]');

    await expect(actionFilter).toBeVisible({ timeout: 10_000 });
    await expect(entityFilter).toBeVisible();
    await expect(userFilter).toBeVisible();
  });

  test('Audit log entries display when seeded data includes audit records', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/audit-log');

    // Table should exist
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    // Either entries are present or empty state message
    const hasEntries = page.locator('tbody tr').first();
    const emptyMessage = page.getByText('No audit log entries found.');

    const hasData = await hasEntries.isVisible().catch(() => false);
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    // One of these must be true
    expect(hasData || isEmpty).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// US-10: Audit Log Immutability
// ═══════════════════════════════════════════════════════════════════════════

test.describe('US-10: Audit Log Immutability', () => {
  test('Audit log viewer has no edit or delete buttons', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/audit-log');

    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    // No edit/delete buttons should be present
    await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible();

    // No dropdown menu triggers in audit log rows
    const dropdownTriggers = page.locator('tbody button[data-slot="dropdown-menu-trigger"]');
    await expect(dropdownTriggers).toHaveCount(0);
  });

  test('Audit log has no bulk action checkboxes', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/audit-log');

    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    // No checkboxes in the table
    const checkboxes = page.locator('table input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(0);

    const checkboxSlots = page.locator('table [data-slot="checkbox"]');
    await expect(checkboxSlots).toHaveCount(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cross-cutting: Admin Navigation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin Navigation', () => {
  test('Clicking each nav link navigates to the correct admin section', async ({ page }) => {
    await devSignIn(page, 'dave@ssh-dev.local');
    await page.goto('/admin/users');

    const nav = page.locator('nav[aria-label="Admin navigation"]');
    await expect(nav).toBeVisible({ timeout: 10_000 });

    // Navigate to Programmes
    await nav.getByText('Programmes').click();
    await expect(page).toHaveURL(/\/admin\/programmes/);
    await expect(page.getByRole('heading', { name: /programmes/i })).toBeVisible({ timeout: 10_000 });

    // Navigate to Dioceses
    await nav.getByText('Dioceses').click();
    await expect(page).toHaveURL(/\/admin\/dioceses/);
    await expect(page.getByRole('heading', { name: /dioceses/i })).toBeVisible({ timeout: 10_000 });

    // Navigate to Document Types
    await nav.getByText('Document Types').click();
    await expect(page).toHaveURL(/\/admin\/document-types/);
    await expect(page.getByRole('heading', { name: /document types/i })).toBeVisible({ timeout: 10_000 });

    // Navigate to Admissions Years
    await nav.getByText('Admissions Years').click();
    await expect(page).toHaveURL(/\/admin\/admissions-years/);
    await expect(page.getByRole('heading', { name: /admissions years/i })).toBeVisible({ timeout: 10_000 });

    // Navigate to Audit Log
    await nav.getByText('Audit Log').click();
    await expect(page).toHaveURL(/\/admin\/audit-log/);
    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible({ timeout: 10_000 });

    // Navigate back to Users
    await nav.getByText('Users').click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText('Alice Admissions')).toBeVisible({ timeout: 10_000 });
  });
});
