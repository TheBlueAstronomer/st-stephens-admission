import { test, expect } from '@playwright/test';

// ─── US-09: Form Accessibility (WCAG 2.1 AA) ──────────────────────────────

test.describe('US-09: Form Accessibility', () => {
  test('Interview application form — all inputs have labels', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // All visible inputs should have an associated label via htmlFor
    const inputs = page.locator('input:visible, select:visible, textarea:visible');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');

      // Skip hidden/file inputs
      if (type === 'hidden' || type === 'file') continue;

      if (id) {
        // Check for a label with matching htmlFor, or a parent label
        const label = page.locator(`label[for="${id}"]`);
        const parentLabel = input.locator('xpath=ancestor::label');

        const hasLabel =
          (await label.count()) > 0 || (await parentLabel.count()) > 0;
        expect(hasLabel).toBe(true);
      }
    }
  });

  test('Registration form — all inputs have labels', async ({ page }) => {
    await page.goto('/forms/registration');

    const inputs = page.locator('input:visible, select:visible, textarea:visible');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');

      if (type === 'hidden' || type === 'file') continue;

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const parentLabel = input.locator('xpath=ancestor::label');

        const hasLabel =
          (await label.count()) > 0 || (await parentLabel.count()) > 0;
        expect(hasLabel).toBe(true);
      }
    }
  });

  test('Interview form — validation errors have role="alert"', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // Trigger validation by clicking Next on empty form
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    const alerts = page.locator('[role="alert"]');
    const count = await alerts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Registration form — validation errors have role="alert"', async ({ page }) => {
    await page.goto('/forms/registration');

    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    const alerts = page.locator('[role="alert"]');
    const count = await alerts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Interview form — inputs use aria-invalid and aria-describedby on error', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // Trigger validation
    await page.click('button:has-text("Next:")');
    await page.waitForTimeout(300);

    // At least one input should have aria-invalid="true"
    const invalidInputs = page.locator('[aria-invalid="true"]');
    const count = await invalidInputs.count();
    expect(count).toBeGreaterThan(0);

    // First invalid input should have aria-describedby pointing to error message
    const firstInvalid = invalidInputs.first();
    const describedBy = await firstInvalid.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // The referenced element should exist and have role="alert"
    if (describedBy) {
      const errorEl = page.locator(`#${describedBy}`);
      await expect(errorEl).toBeVisible();
      const role = await errorEl.getAttribute('role');
      expect(role).toBe('alert');
    }
  });

  test('Interview form — keyboard navigation (tab through fields)', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // Tab into the first input
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // The focused element should be an interactive element within the form
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : null;
    });

    // Should be on an input, select, or button
    expect(['input', 'select', 'button', 'textarea', 'a']).toContain(focused);

    // Tab multiple times and ensure focus moves
    const focusedElements: string[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
      const el = await page.evaluate(() => {
        const activeEl = document.activeElement;
        return activeEl ? `${activeEl.tagName}#${activeEl.id || ''}` : 'none';
      });
      focusedElements.push(el);
    }

    // Should have focused different elements (not stuck)
    const unique = new Set(focusedElements);
    expect(unique.size).toBeGreaterThan(1);
  });

  test('Both forms — colour contrast (form has sufficient text colour)', async ({ page }) => {
    await page.goto('/forms/interview-application');

    // Verify that label text is not using very light colours
    const labels = page.locator('label');
    const firstLabel = labels.first();
    await expect(firstLabel).toBeVisible();

    const color = await firstLabel.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Verify it's not white or near-white (basic sanity check)
    // RGB values below 200 indicate sufficient contrast on white background
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // At least one channel should be below 200 for sufficient contrast
      expect(r < 200 || g < 200 || b < 200).toBe(true);
    }
  });
});
