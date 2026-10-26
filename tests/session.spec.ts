import { APP } from '../config/app.config';
import { env } from '../config/env';
import { THEMES, themeById } from '../config/themes';
import { test } from '../fixtures/test';

/*
 * Runs in its own "session" project after the main suite, because logging out may invalidate the
 * saved session the other tests reuse. Trace/screenshot/video are off: this test types credentials.
 */
const baseline = themeById(APP.baselineThemeId);
const defaultTheme = themeById(APP.defaultThemeId);
const target = THEMES.find((t) => t.id !== baseline.id)!;

test('E-04 theme after logout and login follows persistence rules', async ({ dashboard, loginPage }) => {
  test.fixme(true, 'Logout control not located during exploration; enable once BasePage.logoutItem is confirmed.');
  await dashboard.themeSwitcher.select(target);
  await dashboard.logout();
  await loginPage.login(env.username, env.password);
  await dashboard.waitForReady();
  await dashboard.expectTheme(APP.persistence.clearedOnLogout ? defaultTheme : target, 'Dashboard after logout + login');
});
