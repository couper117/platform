import { test, expect } from '@playwright/test';

// Drives the multi-step team-registration wizard through its first (account)
// step and asserts it advances to the club step. It does NOT submit — no data
// is created — so it is safe to run against any environment.
test('team registration wizard advances from the account step to the club step', async ({ page }) => {
  const stamp = Date.now();
  await page.goto('/auth/team/register');

  await page.fill('input[name="fullName"]', 'E2E Manager');
  await page.fill('input[name="username"]', `e2e_${stamp}`);
  await page.fill('input[name="email"]', `e2e_${stamp}@example.rw`);
  await page.fill('input[name="password"]', 'Manager@123');

  await page.getByRole('button', { name: /next|club/i }).click();

  // Step 2 (the club) reveals the official club-name field.
  await expect(page.locator('input[name="teamName"]')).toBeVisible({ timeout: 12_000 });
});
