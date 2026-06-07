import { expect, test } from '@playwright/test';

// Deterministic, no auth / no DB required. Validates the deployed shell, the
// auth gating, and that navigation into the auth screen works.
test.describe('app shell (signed out)', () => {
  test('loads with the app title', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'פוקר נייט', level: 1 }),
    ).toBeVisible();
  });

  test('gates game creation behind login', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'צריך להתחבר כדי ליצור משחק' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'התחברות / הרשמה' }),
    ).toBeVisible();
  });

  test('shows a login entry in the header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'כניסה' })).toBeVisible();
  });

  test('does not show a share button before a game exists', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'שיתוף' })).toHaveCount(0);
  });

  test('opens the auth screen from the call-to-action', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'התחברות / הרשמה' }).click();
    await expect(page.getByText('כניסה לחשבון')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'המשך עם Google' }),
    ).toBeVisible();
    await expect(page.getByPlaceholder('אימייל')).toBeVisible();
    await expect(page.getByPlaceholder('סיסמה')).toBeVisible();
  });
});
