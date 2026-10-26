import { BrowserContext, Page } from '@playwright/test';
import fs from 'fs';
import { APP } from '../config/app.config';
import { SESSION_FILE } from '../config/paths';

/** Reads the persisted theme mode from the Theme Studio store. */
export async function readStoredPreference(page: Page): Promise<string | null> {
  const { storageKey, parseStoredValue } = APP.persistence;
  if (!storageKey) return null;
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), storageKey);
  return raw === null ? null : parseStoredValue(raw);
}

/** Overwrites settings.mode in the stored Theme Studio state, keeping every other setting intact. */
export async function writeStoredMode(page: Page, mode: string): Promise<void> {
  const key = APP.persistence.storageKey!;
  await page.evaluate(
    ({ key, mode }) => {
      const raw = window.localStorage.getItem(key);
      const store = raw ? JSON.parse(raw) : { state: { settings: {} }, version: 0 };
      store.state = store.state ?? {};
      store.state.settings = { ...(store.state.settings ?? {}), mode };
      window.localStorage.setItem(key, JSON.stringify(store));
    },
    { key, mode },
  );
}

/** Makes every localStorage write of the theme key throw (simulates a quota/private-mode failure). */
export async function failThemePersistence(context: BrowserContext): Promise<void> {
  await context.addInitScript((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (this === window.localStorage && k === key) {
        throw new DOMException('Simulated storage failure', 'QuotaExceededError');
      }
      return original.call(this, k, v);
    };
  }, APP.persistence.storageKey!);
}

/**
 * Removes the theme store from a saved storageState so no test inherits the theme that happened to be
 * active when the setup project logged in.
 */
export function stripThemeFromStorageState(file: string): void {
  const { kind, storageKey } = APP.persistence;
  if (kind !== 'localStorage' || !storageKey) return;
  const state = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
    origins: { origin: string; localStorage: { name: string; value: string }[] }[];
  };
  for (const origin of state.origins) {
    origin.localStorage = origin.localStorage.filter((item) => item.name !== storageKey);
  }
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

/** Saves the app's sessionStorage login keys (not captured by storageState). */
export async function saveSessionStorage(page: Page): Promise<void> {
  const entries = await page.evaluate(
    (pattern) =>
      Object.keys(window.sessionStorage)
        .filter((k) => new RegExp(pattern).test(k))
        .map((k) => [k, window.sessionStorage.getItem(k) ?? ''] as [string, string]),
    APP.authSessionStorageKeys.source,
  );
  if (entries.length === 0) throw new Error('No session keys found in sessionStorage after login');
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ origin: new URL(page.url()).origin, entries }, null, 2));
}

/**
 * Seeds the saved login session into every page of the context, once per tab, so a later logout
 * is not undone on the next navigation.
 */
export async function seedSessionStorage(context: BrowserContext): Promise<void> {
  const { origin, entries } = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8')) as {
    origin: string;
    entries: [string, string][];
  };
  await context.addInitScript(
    ({ origin, entries }) => {
      if (window.location.origin !== origin || window.sessionStorage.getItem('__pw_seeded')) return;
      for (const [k, v] of entries) window.sessionStorage.setItem(k, v);
      window.sessionStorage.setItem('__pw_seeded', '1');
    },
    { origin, entries },
  );
}
