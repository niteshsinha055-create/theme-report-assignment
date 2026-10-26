import { APP } from '../config/app.config';
import { AUTH_FILE } from '../config/paths';
import { THEMES, themeById } from '../config/themes';
import { expect, test } from '../fixtures/test';
import { readStoredPreference } from '../utils/storage';

const baseline = themeById(APP.baselineThemeId);
const defaultTheme = themeById(APP.defaultThemeId);
const target = THEMES.find((t) => t.id !== baseline.id)!;

test.describe('Theme edge cases', () => {
  test('E-01 toggling never makes a network request (client-only persistence)', async ({ dashboard, page }) => {
    const requests: string[] = [];
    page.on('request', (r) => {
      if (['POST', 'PUT', 'PATCH'].includes(r.method())) requests.push(`${r.method()} ${r.url()}`);
    });
    await dashboard.themeSwitcher.select(target);
    await dashboard.themeSwitcher.select(baseline);
    // Documents observed behaviour; a new call here means persistence moved server-side and config must change.
    expect(requests, 'Unexpected write request while toggling theme').toEqual([]);
  });

  test('E-02 rapid toggling ends on the last selection', async ({ dashboard, reportPage, page }) => {
    // Even number of extra flips + one final flip => target.
    for (let i = 0; i < 4; i++) await dashboard.themeSwitcher.flip();
    await dashboard.themeSwitcher.flip();
    await dashboard.expectTheme(target, 'after 5 rapid toggles');
    expect(await readStoredPreference(page)).toBe(target.storedValue);

    await page.reload();
    await dashboard.waitForReady();
    await dashboard.expectTheme(target, 'after reload: persisted value is the last selection');

    await dashboard.navigateTo('report');
    await reportPage.waitForReady();
    await reportPage.expectTheme(target, 'Report after rapid toggling');
  });

  test('E-03 a browser with no stored preference shows the default theme', async ({ browser }) => {
    // Same account state, empty theme store (stripped in auth.setup.ts), no session → login page.
    const fresh = await browser.newContext({ storageState: AUTH_FILE });
    try {
      const page = await fresh.newPage();
      await page.goto(APP.routes.report);
      await expect(page.locator('html')).toHaveAttribute('data-theme-mode', defaultTheme.id);
    } finally {
      await fresh.close();
    }
  });
});
