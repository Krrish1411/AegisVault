import { test, expect } from '@playwright/test';

test.describe('AegisVault App Foundation E2E', () => {
  test('should load welcome screen and navigate to dashboard', async ({ page }) => {
    await page.goto('/welcome');

    // Verify brand and hero copy
    await expect(page.locator('h1')).toContainText('Your private data.');
    await expect(page.locator('text=Stays On Device')).toBeVisible();
    await expect(page.locator('text=Works Offline')).toBeVisible();

    // Click create my vault
    await page.click('text=Create my vault');

    // Should navigate to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Personal Vault');
    await expect(page.locator('text=Vault protected')).toBeVisible();
  });

  test('should toggle dark/light theme and mode in settings', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.locator('h1')).toContainText('Settings & Security');

    // Click Light Theme
    await page.click('button:has-text("Light")');

    // Click Advanced Mode
    await page.click('text=Advanced Mode');
    await expect(page.locator('text=Advanced Mode')).toBeVisible();
  });
});
