import { test, expect } from '@playwright/test';

test.describe('Visual Regression - UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Settings page - General section', async ({ page }) => {
    await page.click('nav button:has-text("Settings")');
    await page.waitForSelector('text=General');
    await expect(page.locator('text=LLM Provider')).toBeVisible();
    await expect(page).toHaveScreenshot('settings-general.png');
  });

  test('Settings page - API Keys section', async ({ page }) => {
    await page.click('nav button:has-text("Settings")');
    await page.click('nav button:has-text("API Keys")');
    await page.waitForSelector('text=Obsidian Vault Path');
    await expect(page).toHaveScreenshot('settings-api-keys.png');
  });

  test('Settings page - System section', async ({ page }) => {
    await page.click('nav button:has-text("Settings")');
    await page.click('nav button:has-text("System")');
    await page.waitForSelector('text=Health Check');
    await expect(page).toHaveScreenshot('settings-system.png');
  });

  test('Analyze page layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Start Analysis');
    await expect(page).toHaveScreenshot('analyze-page.png');
  });

  test('Reports page layout', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('reports-page.png');
  });

  test('Chat page layout', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('chat-page.png');
  });
});

test.describe('Theme variations', () => {
  const themes = ['terminal', 'modern', 'bloomberg'] as const;

  for (const theme of themes) {
    test(`Analyze page - ${theme} theme`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Change theme
      await page.click(`button[title="${theme.charAt(0).toUpperCase() + theme.slice(1)}"]`);
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot(`analyze-${theme}.png`);
    });
  }
});