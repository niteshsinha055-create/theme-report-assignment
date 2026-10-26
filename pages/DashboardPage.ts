import { expect, Locator } from '@playwright/test';
import { APP } from '../config/app.config';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly path = APP.routes.dashboard;

  /** The overview shows a "Set up Your Brand" onboarding panel. */
  get readyMarker(): Locator {
    return this.page.getByText(/Set up Your/i).first();
  }

  async waitForReady(): Promise<void> {
    await expect(this.page).toHaveURL(APP.urlPatterns.dashboard);
    await expect(this.header, 'App header did not render').toBeVisible();
    await expect(this.readyMarker, 'Dashboard overview did not finish loading').toBeVisible();
  }
}
