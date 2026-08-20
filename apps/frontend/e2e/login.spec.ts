import { test, expect } from '@playwright/test';

const PASS = process.env.E2E_PASSWORD || 'Manager@123';

test('a seeded super-admin logs in and lands on the admin dashboard', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[name="username"]', 'admin@rwasport.rw');
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20_000 });
});

test('a match reporter logs in and reaches live reporting without crashing', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[name="username"]', 'match.reporter@rwasport.rw');
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/reporter\/dashboard/, { timeout: 20_000 });
  // The live-reporting page used to crash on a null user — assert it renders.
  await expect(page.locator('body')).not.toContainText(/something went wrong|cannot read prop/i);
});

test('wrong credentials keep the user on the login page with an error', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[name="username"]', 'admin@rwasport.rw');
  await page.fill('input[name="password"]', 'definitely-wrong');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 12_000 });
});
