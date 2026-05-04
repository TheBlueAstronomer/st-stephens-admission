import { test, expect } from '@playwright/test';

// ─── US-04: Registration Form — Rendering ──────────────────────────────────

test.describe('US-04: Registration Form — Rendering', () => {
  test('Form accessible without auth (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/forms/registration');
    expect(response?.status()).toBe(200);
    await expect(page.locator('form')).toBeVisible();
  });

  test('All step labels are present', async ({ page }) => {
    await page.goto('/forms/registration');

    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confirm Identity' })).toBeVisible();
  });

  test('All sections reachable via Next button', async ({ page }) => {
    await page.goto('/forms/registration');

    const stepTitles = [
      'Confirm Identity',
      'Contact & Address',
      'Accommodation',
      'Emergency Contact',
      'Consent & Declaration',
    ];

    // Step 1 visible
    await expect(page.getByRole('heading', { name: stepTitles[0] })).toBeVisible();

    // Fill step 1
    await page.fill('input[name="applicantId"]', 'SSH-2025-0001');
    await page.fill('input[name="legalName"]', 'Test Registrant');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="dateOfBirth"]', '1993-05-20');
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[1] })).toBeVisible();

    // Fill step 2
    await page.fill('input[name="phone"]', '+44 7700 111111');
    await page.fill('input[name="addressLineOne"]', '10 Test Ave');
    await page.fill('input[name="city"]', 'London');
    await page.fill('input[name="postcode"]', 'SW1A 2AA');
    await page.evaluate(() => {
      const el = document.querySelector('select[name="country"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'United Kingdom');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[2] })).toBeVisible();

    // Fill step 3
    await page.evaluate(() => {
      const el = document.querySelector('select[name="accommodationType"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'RESIDENTIAL');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.evaluate(() => {
      const el = document.querySelector('select[name="accommodationDuration"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'FULL_YEAR');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[3] })).toBeVisible();

    // Fill step 4
    await page.fill('input[name="emergencyName"]', 'Jane Doe');
    await page.fill('input[name="emergencyRelation"]', 'Parent');
    await page.fill('input[name="emergencyPhone"]', '+44 7700 222222');
    await page.click('button:has-text("Next:")');
    await expect(page.getByRole('heading', { name: stepTitles[4] })).toBeVisible();
  });

  test('Institutional header (SSH crest) is visible', async ({ page }) => {
    await page.goto('/forms/registration');
    await expect(page.getByText('SSH')).toBeVisible();
    // Header uses curly apostrophe — scope to header
    await expect(page.locator('header').getByText(/St Stephen.s House, Oxford/)).toBeVisible();
  });

  test('Mobile responsive — no horizontal overflow at 375×812', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/forms/registration');

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});

// ─── US-05: Registration Form — Successful Submission ──────────────────────

test.describe('US-05: Registration Form — Successful Submission', () => {
  test('Full submission redirects to confirmation page', async ({ page }) => {
    await page.goto('/forms/registration');

    // Step 1: Confirm Identity — use a seed applicant
    await page.fill('input[name="applicantId"]', 'SSH-2025-0001');
    await page.fill('input[name="legalName"]', 'James Smith');
    await page.fill('input[name="email"]', 'james.smith@example.com');
    await page.fill('input[name="dateOfBirth"]', '1990-05-15');
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 2: Contact & Address
    await page.fill('input[name="phone"]', '+44 7700 333333');
    await page.fill('input[name="addressLineOne"]', '20 Playwright Rd');
    await page.fill('input[name="city"]', 'Oxford');
    await page.fill('input[name="postcode"]', 'OX3 0AA');
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

    // Step 3: Accommodation
    await page.evaluate(() => {
      const el = document.querySelector('select[name="accommodationType"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'RESIDENTIAL');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.evaluate(() => {
      const el = document.querySelector('select[name="accommodationDuration"]') as HTMLSelectElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!;
        setter.call(el, 'FULL_YEAR');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 4: Emergency Contact
    await page.fill('input[name="emergencyName"]', 'Sarah Smith');
    await page.fill('input[name="emergencyRelation"]', 'Spouse');
    await page.fill('input[name="emergencyPhone"]', '+44 7700 444444');
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // Step 5: Consent
    await page.getByText('I confirm I have read and').click();
    await page.waitForTimeout(200);
    await page.getByText("I consent to St Stephen's").click();
    await page.waitForTimeout(200);

    await page.getByRole('button', { name: 'Submit Registration' }).click();

    // Should redirect to confirmation
    await page.waitForURL(/\/forms\/registration\/confirmation/, { timeout: 15_000 });
    expect(page.url()).toContain('/forms/registration/confirmation');
  });

  test('Confirmation page shows Registration Received heading', async ({ page }) => {
    await page.goto('/forms/registration/confirmation?ref=SSH-2025-0001&name=James+Smith');

    await expect(page.getByRole('heading', { name: 'Registration Received' })).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.getByText('SSH-2025-0001')).toBeVisible();
    await expect(page.getByText('What happens next?')).toBeVisible();
  });
});
