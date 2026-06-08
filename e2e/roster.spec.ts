import { expect, test, type Page } from '@playwright/test';

// Authenticated flow — validates groups + roster (Phase: multi-tenant).
//
// Requires a PRE-CONFIRMED Supabase email/password account, supplied via env:
//   TEST_EMAIL=you@example.com TEST_PASSWORD=secret npm run e2e
//
// It creates a fresh group (writes a groups row), then exercises the roster
// picker — adding players and enabling Start. It deliberately STOPS before
// "התחל משחק", so it never writes a game row.
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

async function login(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'התחברות / הרשמה' }).click();
  await page.getByPlaceholder('אימייל').fill(email!);
  await page.getByPlaceholder('סיסמה').fill(password!);
  await page.getByRole('button', { name: 'התחברות', exact: true }).click();
  await expect
    .poll(
      async () => {
        await page.goto('/');
        // Either the NoGroup screen (zero groups) or the setup screen renders.
        const noGroup = await page.getByText('בואו נתחיל').isVisible();
        const setup = await page
          .getByRole('heading', { name: 'מי משחק?' })
          .isVisible();
        return noGroup || setup;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
}

// Always create a fresh, uniquely-named group so each run starts with an empty
// roster. Works from the NoGroup screen or via the header GroupSwitcher.
async function createFreshGroup(page: Page) {
  const name = `E2E ${Date.now()}`;
  const nameInput = page.getByPlaceholder(/שם הקבוצה/);
  if (!(await nameInput.isVisible().catch(() => false))) {
    // Already in a group — open the switcher and choose "create".
    await page.locator('header').getByRole('button').last().click();
    await page.getByRole('button', { name: 'צור קבוצה חדשה' }).click();
  }
  await page.getByPlaceholder(/שם הקבוצה/).fill(name);
  await page.getByRole('button', { name: 'צור', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'מי משחק?' }),
  ).toBeVisible();
}

test.describe('groups + roster (authenticated)', () => {
  test.skip(
    !email || !password,
    'Set TEST_EMAIL and TEST_PASSWORD (a confirmed account) to run.',
  );

  test.beforeEach(async ({ page }) => {
    await login(page);
    await createFreshGroup(page);
  });

  test('a fresh group starts with an empty roster', async ({ page }) => {
    await expect(
      page.getByText('עדיין אין שחקנים בקבוצה'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'התחל משחק' }),
    ).toBeDisabled();
  });

  test('adding players enables Start (no game is created)', async ({
    page,
  }) => {
    const start = page.getByRole('button', { name: 'התחל משחק' });
    const addInput = page.getByPlaceholder('הוסף שחקן חדש לרשימה');

    for (const name of ['אלפא', 'בטא']) {
      await addInput.fill(name);
      await page.getByRole('button', { name: 'הוסף', exact: true }).click();
      await expect(page.getByLabel(`סכום כניסה של ${name}`)).toBeVisible();
    }
    await expect(start).toBeEnabled();
    // Intentionally do NOT click Start — that would create a real DB game.
  });
});
