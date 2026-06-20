// @ts-check
import { test, expect } from '@playwright/test';

test('loads MediaMine home page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/MediaMine/i);
  await expect(page.getByRole('heading', { name: /MediaMine/i })).toBeVisible();
});

test('shows key controls on first load', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('NewsAPI Key')).toBeVisible();
  await expect(page.getByLabel('State *')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get News Headlines' })).toBeDisabled();
});
