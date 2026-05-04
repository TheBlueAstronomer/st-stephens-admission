import { test, expect } from '@playwright/test';

// ─── US-01: Interview Application Form — Rendering ─────────────────────────

test.describe('US-01: Interview Application Form — Rendering', () => {
  test('Form accessible without auth (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/forms/interview-application');
    expect(response?.status()).toBe(200);
    await expect(page.locator('form')).toBeVisible();
  });

  test('All step labels are present in the progress stepper', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // The form has 6 steps
    await expect(page.getByText('Step 1 of 6')).toBeVisible();

    // Step label visible at top
    await expect(page.getByText('Personal Details')).toBeVisible();
  });

  test('All sections reachable via Next button', async ({ page }) => {
    await page.goto('/forms/interview-application');

    const stepTitles = [
      'Personal Details',
      'BAP Status',
      'Academic History',
      'References',
      'Supporting Information',
      'Consent & Declaration',
    ];

    // Step 1 is already visible
    await expect(page.getByRole('heading', { name: stepTitles[0] })).toBeVisible();

    // Fill step 1 minimal required fields to advance
    await page.fill('input[name="legalName"]', 'Test User');
    await page.fill('input[name="dateOfBirth"]', '1990-01-01');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+44 7700 000000');
    await page.fill('input[name="addressLineOne"]', '1 Test St');
    await page.fill('input[name="city"]', 'Oxford');
    await page.fill('input[name="postcode"]', 'OX1 1AA');
    await page.evaluate(() => {
      const el = document.querySelector('select[name="country"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'United Kingdom');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[1] })).toBeVisible();

    // Fill step 2
    await page.evaluate(() => {
      const el = document.querySelector('select[name="diocese"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'Oxford');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.fill('input[name="directorOfOrdinands"]', 'Rev. Test');
    await page.fill('input[name="ddoEmail"]', 'ddo@test.org');
    await page.evaluate(() => {
      const el = document.querySelector('select[name="bapStageOneStatus"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'COMPLETED');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[2] })).toBeVisible();

    // Fill step 3 — programme interest
    await page.evaluate(() => {
      const el = document.querySelector('select[name="programmeInterest"]') as HTMLSelectElement;
      if (el && el.options.length > 1) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, el.options[1].value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[3] })).toBeVisible();

    // Fill step 4 — references
    await page.fill('input[name="ref1Name"]', 'Dr. A');
    await page.fill('input[name="ref1Email"]', 'a@uni.ac.uk');
    await page.fill('input[name="ref1Institution"]', 'Oxford');
    await page.fill('input[name="ref2Name"]', 'Dr. B');
    await page.fill('input[name="ref2Email"]', 'b@uni.ac.uk');
    await page.fill('input[name="ref2Institution"]', 'Cambridge');
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[4] })).toBeVisible();

    // Fill step 5 — personal statement (200+ words)
    const words = Array(210).fill('vocation').join(' ');
    await page.fill('textarea[name="personalStatement"]', words);
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[5] })).toBeVisible();
  });

  test('Institutional header (SSH crest) is visible', async ({ page }) => {
    await page.goto('/forms/interview-application');
    await expect(page.getByText('SSH')).toBeVisible();
    // Header uses curly apostrophe — use locator scoped to header
    await expect(page.locator('header').getByText(/St Stephen.s House, Oxford/)).toBeVisible();
  });

  test('Mobile responsive — no horizontal overflow at 375×812', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/forms/interview-application');

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});

// ─── US-02: Interview Application Form — Validation ────────────────────────

test.describe('US-02: Interview Application Form — Validation', () => {
  test('Required field validation — empty step 1 shows errors', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // Click Next without filling anything
    await page.click('button:has-text("Next:")');

    // Should show validation errors (form stays on step 1)
    await expect(page.getByText('Step 1 of 6')).toBeVisible();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('Step blocked on errors — does NOT advance to step 2', async ({ page }) => {
    await page.goto('/forms/interview-application');

    await page.click('button:has-text("Next:")');

    // Still on step 1
    await expect(page.getByText('Step 1 of 6')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Personal Details' })).toBeVisible();
  });

  test('Valid step advances to step 2', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // Fill all required step 1 fields
    await page.fill('input[name="legalName"]', 'Test User');
    await page.fill('input[name="dateOfBirth"]', '1990-01-01');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+44 7700 000000');
    await page.fill('input[name="addressLineOne"]', '1 Test St');
    await page.fill('input[name="city"]', 'Oxford');
    await page.fill('input[name="postcode"]', 'OX1 1AA');
    await page.evaluate(() => {
      const el = document.querySelector('select[name="country"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'United Kingdom');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.click('button:has-text("Next:")');

    // Should advance to step 2
    await expect(page.getByText('Step 2 of 6')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'BAP Status' })).toBeVisible();
  });

  test('Accessible errors — validation messages have role="alert"', async ({ page }) => {
    await page.goto('/forms/interview-application');

    await page.click('button:has-text("Next:")');

    const alerts = page.locator('[role="alert"]');
    const count = await alerts.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─── US-03: Interview Application Form — Successful Submission ─────────────

test.describe('US-03: Interview Application Form — Successful Submission', () => {
  test('Full submission redirects to confirmation page', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // Step 1: Personal Details
    await page.fill('input[name="legalName"]', 'E2E Tester');
    await page.fill('input[name="dateOfBirth"]', '1992-06-15');
    await page.fill('input[name="email"]', `e2e-${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', '+44 7700 999999');
    await page.fill('input[name="addressLineOne"]', '99 Playwright Lane');
    await page.fill('input[name="city"]', 'Oxford');
    await page.fill('input[name="postcode"]', 'OX2 0DP');
    await page.evaluate(() => {
      const el = document.querySelector('select[name="country"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'United Kingdom');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 2: BAP & Ecclesial
    await page.evaluate(() => {
      const el = document.querySelector('select[name="diocese"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'Oxford');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.fill('input[name="directorOfOrdinands"]', 'Rev. E2E');
    await page.fill('input[name="ddoEmail"]', 'ddo@e2e.org');
    await page.evaluate(() => {
      const el = document.querySelector('select[name="bapStageOneStatus"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'COMPLETED');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 3: Academic History
    await page.evaluate(() => {
      const el = document.querySelector('select[name="programmeInterest"]') as HTMLSelectElement;
      if (el && el.options.length > 1) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, el.options[1].value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 4: References
    await page.fill('input[name="ref1Name"]', 'Dr. Alpha');
    await page.fill('input[name="ref1Email"]', 'alpha@cam.ac.uk');
    await page.fill('input[name="ref1Institution"]', 'Cambridge');
    await page.fill('input[name="ref2Name"]', 'Dr. Beta');
    await page.fill('input[name="ref2Email"]', 'beta@ox.ac.uk');
    await page.fill('input[name="ref2Institution"]', 'Oxford');
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 5: Supporting Information
    const words = Array(210).fill('vocation').join(' ');
    await page.fill('textarea[name="personalStatement"]', words);
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 6: Consent
    await page.getByText('I confirm I have read and').click();
    await page.waitForTimeout(200);
    await page.getByText("I consent to St Stephen's").click();
    await page.waitForTimeout(200);

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Should redirect to confirmation
    await page.waitForURL(/\/forms\/interview-application\/confirmation/, { timeout: 15_000 });
    expect(page.url()).toContain('/forms/interview-application/confirmation');
  });

  test('Confirmation page shows green checkmark and Application Received heading', async ({ page }) => {
    // Navigate directly to confirmation page with params
    await page.goto('/forms/interview-application/confirmation?ref=SSH-2025-0001&name=Test+User');

    await expect(page.getByRole('heading', { name: 'Application Received' })).toBeVisible();
    // Green checkmark icon is rendered
    await expect(page.locator('svg').first()).toBeVisible();
    // Reference number visible
    await expect(page.getByText('SSH-2025-0001')).toBeVisible();
    // Next steps
    await expect(page.getByText('What happens next?')).toBeVisible();
  });

  test('Confirmation page has no resubmit button', async ({ page }) => {
    await page.goto('/forms/interview-application/confirmation?ref=SSH-2025-0001&name=Test+User');

    // No submit/resubmit button
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await expect(submitBtn).not.toBeVisible();
  });
});
