import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { APP } from '../config/app.config';
import { env } from '../config/env';
import { AUTH_FILE } from '../config/paths';
import { LoginPage } from '../pages/LoginPage';
import { saveSessionStorage, stripThemeFromStorageState } from '../utils/storage';

// Runs once before the suite. Trace/screenshot/video are disabled for this project in playwright.config.ts.
setup('authenticate as general user', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await new LoginPage(page).login(env.username, env.password);
  await expect(page, 'Login should land on the Dashboard').toHaveURL(APP.urlPatterns.dashboard);
  await page.context().storageState({ path: AUTH_FILE });
  stripThemeFromStorageState(AUTH_FILE);
  // The app keeps its session in sessionStorage, which storageState does not include.
  await saveSessionStorage(page);
});
