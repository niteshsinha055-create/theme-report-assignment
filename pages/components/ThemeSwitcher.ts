import { expect, Locator, Page } from '@playwright/test';
import { ThemeSpec } from '../../config/themes';

/**
 * Light/dark toggle in the header. Its title (= accessible name) names the mode it switches TO:
 * "Switch to Dark Mode" while light is active, "Switch to Light Mode" while dark is active.
 * Toggling is client-only: it updates <html data-theme-mode> and localStorage, with no network call.
 */
export class ThemeSwitcher {
  constructor(private readonly page: Page) {}

  get toggle(): Locator {
    return this.page.locator('header.dash-header').getByRole('button', { name: /^Switch to (Light|Dark) Mode$/ });
  }

  async currentMode(): Promise<string | null> {
    return this.page.locator('html').getAttribute('data-theme-mode');
  }

  /** Switches to `theme` if it is not already active. Idempotent. */
  async select(theme: ThemeSpec): Promise<void> {
    if ((await this.currentMode()) === theme.id) return;
    await this.clickToggle(theme);
    await expect(this.page.locator('html'), `Theme mode did not change to "${theme.id}"`).toHaveAttribute(
      'data-theme-mode',
      theme.id,
    );
  }

  /** Clicks the toggle without waiting for the result (used for failure and rapid-switch tests). */
  async clickToggle(towards: ThemeSpec): Promise<void> {
    await expect(this.toggle, `Toggle should offer "Switch to ${towards.label}"`).toHaveAccessibleName(
      `Switch to ${towards.label}`,
    );
    await this.toggle.click();
  }

  /** Clicks whatever the toggle currently offers (rapid switching). */
  async flip(): Promise<void> {
    await this.toggle.click();
  }
}
