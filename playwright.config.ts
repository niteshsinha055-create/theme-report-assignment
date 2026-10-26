import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';
import { AUTH_FILE } from './config/paths';

export default defineConfig({
  testDir: './tests',
  /*
   * All tests share ONE staging account, and the theme is per-user state.
   * Parallel workers would overwrite each other's theme mid-test, so tests run serially.
   * Each test is still independent: the auto fixture resets the baseline theme first.
   */
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      // Login types the password; keep it out of traces, screenshots and videos.
      use: { trace: 'off', screenshot: 'off', video: 'off' },
    },
    {
      name: 'chromium',
      testIgnore: [/auth\.setup\.ts/, /session\.spec\.ts/],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
    {
      // Logout may revoke the shared saved session, so this runs last and records no artifacts.
      name: 'session',
      testMatch: /session\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE, trace: 'off', screenshot: 'off', video: 'off' },
      dependencies: ['chromium'],
    },
  ],
});
