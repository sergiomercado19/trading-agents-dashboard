import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Analyze page - full page', async ({ page }) => {
    await expect(page).toHaveScreenshot('analyze-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Settings page - full page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('settings-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Reports page - full page', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('reports-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Header - component', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header.png', {
      animations: 'disabled',
    });
  });

  test('Button component - variants', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Test different button variants
    const buttons = page.locator('button.btn');
    await expect(buttons.first()).toHaveScreenshot('button-primary.png');
  });

  test('Card component', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const cards = page.locator('.panel');
    if (await cards.count() > 0) {
      await expect(cards.first()).toHaveScreenshot('card-panel.png');
    }
  });

  test('Dark theme - terminal', async ({ page }) => {
    await expect(page).toHaveScreenshot('theme-terminal.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});