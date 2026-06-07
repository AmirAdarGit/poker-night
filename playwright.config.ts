import { defineConfig, devices } from '@playwright/test';

// E2E runs against a local production preview build. Supabase env vars are
// optional: without them the app degrades to the signed-out shell, which the
// smoke tests cover. The authenticated roster flow (roster.spec.ts) only runs
// when TEST_EMAIL / TEST_PASSWORD are provided and stops before any DB write.
const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    locale: 'he-IL',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
