import { test as base } from '@playwright/test';
import { APP } from '../config/app.config';
import { themeById } from '../config/themes';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { ReportPage } from '../pages/ReportPage';
import { seedSessionStorage } from '../utils/storage';

type Fixtures = {
  loginPage: LoginPage;
  dashboard: DashboardPage;
  reportPage: ReportPage;
  /** Uncaught page errors collected during the test; attached to the report when non-empty. */
  pageErrors: Error[];
  /** Auto: every test starts on the Dashboard with the baseline theme applied. */
  baselineTheme: void;
};

export const test = base.extend<Fixtures>({
  // Restore the sessionStorage-based login in every tab of the test's context.
  context: async ({ context }, use) => {
    await seedSessionStorage(context);
    await use(context);
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboard: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  reportPage: async ({ page }, use) => {
    await use(new ReportPage(page));
  },
  pageErrors: [
    async ({ page }, use, testInfo) => {
      const errors: Error[] = [];
      page.on('pageerror', (error) => errors.push(error));
      await use(errors);
      if (errors.length) {
        await testInfo.attach('page-errors.txt', {
          body: errors.map((e) => e.stack ?? e.message).join('\n\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
  baselineTheme: [
    async ({ dashboard }, use) => {
      const baseline = themeById(APP.baselineThemeId);
      await dashboard.goto();
      await dashboard.themeSwitcher.select(baseline);
      await dashboard.expectTheme(baseline, 'baseline reset before test');
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
