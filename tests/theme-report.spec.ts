import { APP } from '../config/app.config';
import { THEMES, themeById } from '../config/themes';
import { expect, test } from '../fixtures/test';
import { ReportPage } from '../pages/ReportPage';
import { ContrastResult, measureContrast } from '../utils/contrast';
import { attachJson, attachScreenshot } from '../utils/evidence';
import { failThemePersistence, readStoredPreference, writeStoredMode } from '../utils/storage';

const baseline = themeById(APP.baselineThemeId); // light
const defaultTheme = themeById(APP.defaultThemeId);
const target = THEMES.find((t) => t.id !== baseline.id)!; // dark
/** The app has two modes, so the "second change" in TH-05 goes back to the baseline. */
const next = THEMES.filter((t) => t.id !== baseline.id)[1] ?? baseline;

// The auto fixture `baselineTheme` has already opened the Dashboard with the baseline theme applied.

test.describe('Theme update reflected in Report Module', () => {
  test('TH-01 change theme from Dashboard applies it', async ({ dashboard, page }, testInfo) => {
    await dashboard.themeSwitcher.select(target);
    await dashboard.expectTheme(target, 'Dashboard right after toggling');
    await expect(dashboard.themeSwitcher.toggle, 'Toggle should now offer the opposite mode').toHaveAccessibleName(
      `Switch to ${baseline.label}`,
    );
    expect(await readStoredPreference(page), 'Preference should be persisted to localStorage').toBe(target.storedValue);
    await attachScreenshot(dashboard, testInfo, `TH-01-dashboard-${target.id}`);
  });

  test('TH-02 Report Module reflects the selected theme', async ({ dashboard, reportPage }, testInfo) => {
    await dashboard.themeSwitcher.select(target);
    await dashboard.navigateTo('report');
    await reportPage.waitForReady();
    await reportPage.expectTheme(target, 'Report Module opened after theme change');
    await attachScreenshot(reportPage, testInfo, `TH-02-report-${target.id}`);
  });

  test('TH-03 theme stays consistent after refreshing Report Module', async ({ dashboard, reportPage, page }) => {
    await dashboard.themeSwitcher.select(target);
    await dashboard.navigateTo('report');
    await reportPage.waitForReady();

    await page.reload();
    await reportPage.waitForReady();
    await reportPage.expectTheme(target, 'Report Module after reload');
    expect(await readStoredPreference(page), 'Stored preference should still be the selected theme').toBe(
      target.storedValue,
    );
  });

  test('TH-04 theme is consistent across Dashboard → Report → Dashboard (incl. back/forward)', async ({
    dashboard,
    reportPage,
    page,
  }) => {
    await dashboard.themeSwitcher.select(target);

    await test.step('Dashboard → Report', async () => {
      await dashboard.navigateTo('report');
      await reportPage.waitForReady();
      await reportPage.expectTheme(target, 'Report after in-app navigation');
    });
    await test.step('Report → Dashboard', async () => {
      await reportPage.navigateTo('dashboard');
      await dashboard.waitForReady();
      await dashboard.expectTheme(target, 'Dashboard after returning from Report');
    });
    await test.step('Browser back → Report', async () => {
      await page.goBack();
      await reportPage.waitForReady();
      await reportPage.expectTheme(target, 'Report after browser back');
    });
    await test.step('Browser forward → Dashboard', async () => {
      await page.goForward();
      await dashboard.waitForReady();
      await dashboard.expectTheme(target, 'Dashboard after browser forward');
    });
  });

  test('TH-05 latest selection wins when theme is changed again', async ({ dashboard, reportPage, page }) => {
    await dashboard.themeSwitcher.select(target);
    await dashboard.navigateTo('report');
    await reportPage.waitForReady();
    await reportPage.expectTheme(target, 'Report after first change');

    await test.step(`Change again on the Report Module (${target.id} → ${next.id})`, async () => {
      await reportPage.themeSwitcher.select(next);
      await reportPage.expectTheme(next, 'Report immediately after second change');
    });
    await test.step('Reopen Report Module from Dashboard', async () => {
      await reportPage.navigateTo('dashboard');
      await dashboard.waitForReady();
      await dashboard.navigateTo('report');
      await reportPage.waitForReady();
      await reportPage.expectTheme(next, 'Reopened Report shows the latest selection');
      expect(await readStoredPreference(page)).toBe(next.storedValue);
    });
  });

  test('TH-06 Report opened directly / in a new tab follows preference rules', async ({
    dashboard,
    reportPage,
    page,
    browser,
  }, testInfo) => {
    await dashboard.themeSwitcher.select(target);

    await test.step('Direct URL in the same tab', async () => {
      await reportPage.goto();
      await reportPage.expectTheme(target, 'Report opened by direct URL');
    });

    await test.step('Direct URL in a new tab (shares localStorage, not sessionStorage)', async () => {
      // A real new tab shares localStorage (theme) but starts with empty sessionStorage (login session).
      // A fresh context built from the live storageState reproduces exactly that.
      const newTabContext = await browser.newContext({ storageState: await page.context().storageState() });
      try {
        const tab = await newTabContext.newPage();
        const tabReport = new ReportPage(tab);
        await tab.goto(APP.routes.report);
        // Theme rule: the stored preference applies on whatever page loads, including the login page.
        await tabReport.expectThemeOn(
          { root: tab.locator('html'), body: tab.locator('body') },
          target,
          'new tab (preference read from localStorage)',
        );
        await attachScreenshot(tabReport, testInfo, `TH-06-new-tab-${target.id}`);
        // DEF-05: with "Remember me" checked, a new tab is still sent to the login page.
        await expect
          .soft(tab, 'DEF-05: opening the Report Module in a new tab should keep the signed-in session')
          .toHaveURL(APP.urlPatterns.report);
      } finally {
        await newTabContext.close();
      }
    });
  });

  for (const theme of THEMES) {
    test(`TH-07 [${theme.id}] Report Module elements stay readable and usable`, async ({ dashboard, reportPage }, testInfo) => {
      await dashboard.themeSwitcher.select(theme);
      await dashboard.navigateTo('report');
      await reportPage.waitForReady();
      await reportPage.expectTheme(theme, 'TH-07 precondition');

      const results: ContrastResult[] = [];
      const measure = async (targets: Record<string, import('@playwright/test').Locator>) => {
        for (const [label, locator] of Object.entries(targets)) {
          await expect.soft(locator, `${label} should be visible in theme "${theme.id}"`).toBeVisible();
          if (await locator.isVisible()) results.push(await measureContrast(locator, label));
        }
      };

      await test.step('Page elements: table, toolbar, sidebar, pagination', async () => {
        await measure(reportPage.readabilityTargets());
        await expect.soft(reportPage.newUserButton, 'New User button should be enabled').toBeEnabled();
        await expect.soft(reportPage.pageNumberInput, 'Page number input should be editable').toBeEditable();
      });

      await test.step('Filter dialog', async () => {
        await reportPage.openFilterDialog();
        await measure(reportPage.filterDialogReadabilityTargets());
        await attachScreenshot(reportPage, testInfo, `TH-07-filter-dialog-${theme.id}`);
        await reportPage.closeFilterDialog();
      });

      await test.step('View menu (portal-rendered popover)', async () => {
        await reportPage.openViewMenu();
        const firstOption = reportPage.viewMenuOption;
        await measure({ 'view menu option': firstOption });
        await reportPage.closeMenu();
      });

      await attachJson(testInfo, `TH-07-contrast-${theme.id}.json`, results);
      for (const r of results) {
        const min = r.largeText ? APP.minContrastRatioLargeText : APP.minContrastRatio;
        expect
          .soft(
            r.ratio,
            `${r.label}: contrast ${r.ratio}:1 (${r.foreground} on ${r.background}${r.approximate ? ', gradient behind text' : ''}) ` +
              `is below ${min}:1 in "${theme.id}"`,
          )
          .toBeGreaterThanOrEqual(min);
      }
    });
  }
});

test.describe('TH-08 failure handling', () => {
  test('TH-08a failed preference write leaves a consistent state', async ({ dashboard, page, context, pageErrors }) => {
    // No server API exists for the theme; the only persistence step that can fail is the localStorage write.
    await failThemePersistence(context);
    await page.reload();
    await dashboard.waitForReady();

    await dashboard.themeSwitcher.flip();

    await test.step('UI either keeps the old theme or tells the user the change was not saved', async () => {
      await expect
        .poll(async () => (await dashboard.isThemeApplied(baseline)) || (await dashboard.errorNotification.isVisible()), {
          message: 'Theme changed on screen although it could not be saved, and no error was shown (silent divergence)',
        })
        .toBe(true);
    });

    await test.step('After reload the persisted (old) theme is shown', async () => {
      await page.reload();
      await dashboard.waitForReady();
      await dashboard.expectTheme(baseline, 'after reload following a failed save');
    });

    expect.soft(pageErrors, 'A storage failure should not surface as an uncaught exception').toEqual([]);
  });

  test('TH-08b unsupported stored value falls back to the default theme', async ({ dashboard, page, pageErrors }) => {
    await writeStoredMode(page, 'unsupported-mode-xyz');
    await page.reload();
    await dashboard.waitForReady();
    await dashboard.expectTheme(defaultTheme, 'fallback for an unsupported stored mode');
    await expect(dashboard.themeSwitcher.toggle, 'Theme toggle should remain usable').toBeEnabled();
    expect(pageErrors, 'The app threw uncaught errors for an unsupported theme value').toEqual([]);
  });
});
