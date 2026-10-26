import { expect, Locator } from '@playwright/test';
import { APP } from '../config/app.config';
import { SurfaceMap } from '../utils/themeAssertions';
import { BasePage } from './BasePage';

/** Report Builder (#/dashboard/reports): MUI data table of users with toolbar, filter dialog and pagination. */
export class ReportPage extends BasePage {
  readonly path = APP.routes.report;

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Reports', level: 1 });
  }

  get table(): Locator {
    return this.page.getByRole('table').first();
  }

  get tableHeaderCell(): Locator {
    return this.table.getByRole('columnheader', { name: 'User id' });
  }

  get tableBodyCell(): Locator {
    return this.table.getByRole('cell').nth(1);
  }

  get newUserButton(): Locator {
    return this.page.getByRole('button', { name: 'New User' });
  }

  get viewButton(): Locator {
    return this.page.getByRole('button', { name: /^View:/ });
  }

  get filterButton(): Locator {
    return this.page.getByRole('button', { name: 'Filter', exact: true });
  }

  get pageNumberInput(): Locator {
    return this.page.getByRole('textbox', { name: /Page number/ });
  }

  /**
   * The filter dialog has no role="dialog" (see DEF-06), so it is located as the MUI paper
   * containing the "Filter columns" heading.
   */
  get filterDialog(): Locator {
    return this.page
      .locator('.MuiPaper-root')
      .filter({ has: this.page.getByRole('heading', { name: 'Filter columns' }) })
      .first();
  }

  get addConditionButton(): Locator {
    return this.filterDialog.getByRole('button', { name: /add condition/i });
  }

  /** Popover menu rendered in a portal under <body>. */
  get openMenu(): Locator {
    return this.page.locator('.MuiPopover-root .MuiPaper-root, .MuiMenu-root .MuiPaper-root').first();
  }

  async waitForReady(): Promise<void> {
    await expect(this.page).toHaveURL(APP.urlPatterns.report);
    await expect(this.heading, 'Report Module heading did not render').toBeVisible();
    await expect(this.tableHeaderCell, 'Report table did not render').toBeVisible();
  }

  surfaces(): SurfaceMap {
    return {
      ...super.surfaces(),
      table: this.table,
      tableHeader: this.tableHeaderCell,
      tableCell: this.tableBodyCell,
      button: this.newUserButton,
      input: this.pageNumberInput,
    };
  }

  readabilityTargets(): Record<string, Locator> {
    return {
      'report heading': this.heading,
      'table header cell': this.tableHeaderCell,
      'table body cell': this.tableBodyCell,
      'active sidebar item': this.navLink('report'),
      'sidebar section label': this.sidebar.getByText('Reports', { exact: true }),
      'New User button': this.newUserButton,
      'view selector': this.viewButton,
      'page number input': this.pageNumberInput,
    };
  }

  async openFilterDialog(): Promise<void> {
    await this.filterButton.click();
    await expect(this.filterDialog, 'Filter dialog did not open').toBeVisible();
  }

  /** Escape does not close this dialog (DEF-06); use its Close button. */
  async closeFilterDialog(): Promise<void> {
    await this.filterDialog.getByRole('button', { name: 'Close' }).click();
    await expect(this.filterDialog, 'Filter dialog did not close').toBeHidden();
  }

  filterDialogReadabilityTargets(): Record<string, Locator> {
    return {
      'filter dialog title': this.filterDialog.getByRole('heading', { name: 'Filter columns' }),
      'filter dialog empty-state text': this.filterDialog.getByText(/No conditions yet/),
      'filter dialog "+ Add condition"': this.addConditionButton,
    };
  }

  async openViewMenu(): Promise<void> {
    await this.viewButton.click();
    await expect(this.openMenu, 'View menu did not open').toBeVisible();
  }

  async closeMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.openMenu).toBeHidden();
  }
}
