import { test, expect } from '@playwright/test';

test('home loads past the splash and renders the app shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Rwa|Rwanda|Sport/i);
  // Content appears after the ~3s splash — match on stable nav/hero copy.
  await expect(
    page.getByText(/Rwandan sport|Explore|Matches|Leagues/i).first()
  ).toBeVisible({ timeout: 20_000 });
});
