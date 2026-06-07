import { expect, test } from '@playwright/test';

// Authenticated flow — validates the roster picker (Phase 2).
//
// Requires a PRE-CONFIRMED Supabase email/password account, supplied via env:
//   TEST_EMAIL=you@example.com TEST_PASSWORD=secret npm run e2e
//
// It only exercises pre-game UI (selecting roster players, editing buy-ins),
// which is local React state — it deliberately STOPS before "התחל משחק" so it
// never writes a game to the shared production database.
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

test.describe('roster picker (authenticated)', () => {
  test.skip(
    !email || !password,
    'Set TEST_EMAIL and TEST_PASSWORD (a confirmed account) to run.',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'התחברות / הרשמה' }).click();
    await page.getByPlaceholder('אימייל').fill(email!);
    await page.getByPlaceholder('סיסמה').fill(password!);
    await page.getByRole('button', { name: 'התחברות', exact: true }).click();
    // Session persists; reload lands on the authenticated setup screen.
    await expect
      .poll(async () => {
        await page.goto('/');
        return page.getByRole('heading', { name: 'מי משחק?' }).isVisible();
      }, { timeout: 15_000 })
      .toBe(true);
  });

  test('shows the seeded roster and a default buy-in', async ({ page }) => {
    await expect(
      page.getByLabel('סכום כניסה ברירת מחדל'),
    ).toBeVisible();
    // At least a couple of the seeded names render as selectable chips.
    await expect(
      page.getByRole('button', { name: 'אמיר אדר' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'רז' })).toBeVisible();
  });

  test('selecting two players enables Start (no game is created)', async ({
    page,
  }) => {
    const start = page.getByRole('button', { name: 'התחל משחק' });
    await expect(start).toBeDisabled();

    await page.getByRole('button', { name: 'אמיר אדר' }).click();
    await page.getByRole('button', { name: 'רז' }).click();

    // Selected players appear in the list with editable buy-ins.
    await expect(page.getByLabel('סכום כניסה של אמיר אדר')).toBeVisible();
    await expect(start).toBeEnabled();
    // Intentionally do NOT click Start — that would create a real DB game.
  });

  test('toggling a chip off removes the player', async ({ page }) => {
    const chip = page.getByRole('button', { name: 'רז' });
    await chip.click();
    await expect(page.getByLabel('סכום כניסה של רז')).toBeVisible();
    await chip.click();
    await expect(page.getByLabel('סכום כניסה של רז')).toHaveCount(0);
  });
});
