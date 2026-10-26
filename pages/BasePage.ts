import { Locator, Page } from '@playwright/test';
import { ThemeSpec } from '../config/themes';
import { assertThemeApplied, isThemeApplied, SurfaceMap } from '../utils/themeAssertions';
import { ThemeSwitcher } from './components/ThemeSwitcher';

export type ModuleName = 'dashboard' | 'report' | 'themeStudio';

const NAV_LABELS: Record<ModuleName, string> = {
  dashboard: 'Dashboard',
  report: 'Report Builder',
  themeStudio: 'Theme Studio',
};

/** Shared app shell: header, sidebar, theme toggle and theme assertions. */
export abstract class BasePage {
  readonly themeSwitcher: ThemeSwitcher;
  abstract readonly path: string;

  constructor(readonly page: Page) {
    this.themeSwitcher = new ThemeSwitcher(page);
  }

  abstract waitForReady(): Promise<void>;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForReady();
  }

  get header(): Locator {
    return this.page.locator('header.dash-header');
  }

  /** The sidebar is an <aside> without a navigation landmark, so links are scoped by its class. */
  get sidebar(): Locator {
    return this.page.locator('aside.dash-sidebar');
  }

  navLink(module: ModuleName): Locator {
    return this.sidebar.getByRole('link', { name: NAV_LABELS[module], exact: true });
  }

  /** In-app (SPA) navigation. Call the target page's waitForReady() afterwards. */
  async navigateTo(module: ModuleName): Promise<void> {
    await this.navLink(module).click();
  }

  /** Avatar button (no accessible name) shows the user's initial; masked in evidence screenshots. */
  get userMenu(): Locator {
    return this.header.getByRole('button').last();
  }

  // TODO(explore): logout control not located yet (likely inside the avatar menu)
  get logoutItem(): Locator {
    return this.page.getByRole('menuitem', { name: /log ?out|sign ?out/i });
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutItem.click();
  }

  get errorNotification(): Locator {
    return this.page.getByRole('alert').first();
  }

  sensitiveLocators(): Locator[] {
    return [this.userMenu];
  }

  surfaces(): SurfaceMap {
    return {
      root: this.page.locator('html'),
      body: this.page.locator('body'),
      header: this.header,
      sidebar: this.sidebar,
    };
  }

  async expectTheme(theme: ThemeSpec, context: string): Promise<void> {
    await assertThemeApplied(this.page, this.surfaces(), theme, context);
  }

  async expectThemeOn(surfaces: SurfaceMap, theme: ThemeSpec, context: string): Promise<void> {
    await assertThemeApplied(this.page, surfaces, theme, context);
  }

  async isThemeApplied(theme: ThemeSpec): Promise<boolean> {
    return isThemeApplied(this.page, this.surfaces(), theme);
  }
}
