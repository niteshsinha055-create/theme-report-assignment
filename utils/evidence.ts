import { TestInfo } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

/** Full-page screenshot attached to the HTML report, with account details masked. */
export async function attachScreenshot(pageObject: BasePage, testInfo: TestInfo, name: string): Promise<void> {
  const body = await pageObject.page.screenshot({ fullPage: true, mask: pageObject.sensitiveLocators() });
  await testInfo.attach(`${name}.png`, { body, contentType: 'image/png' });
}

export async function attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
}
