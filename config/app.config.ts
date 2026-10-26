/**
 * Application facts confirmed during exploration of OomniEye staging (see docs/exploration-notes.md).
 */

export type PersistenceKind = 'localStorage' | 'sessionStorage' | 'cookie' | 'server' | 'unknown';

export interface PreferenceApi {
  /** Matches the request that saves the theme. Do not use the `g` flag (RegExp.test is stateful with it). */
  urlPattern: RegExp;
  method: 'POST' | 'PUT' | 'PATCH';
}

export interface AppConfig {
  routes: { login: string; dashboard: string; report: string; themeStudio: string };
  urlPatterns: { login: RegExp; dashboard: RegExp; report: RegExp };
  /** Theme every test starts from (reset by the auto fixture in fixtures/test.ts). */
  baselineThemeId: string;
  /** Theme shown when no preference is stored or the stored one is invalid. */
  defaultThemeId: string;
  persistence: {
    kind: PersistenceKind;
    /** Storage key holding the preference. */
    storageKey?: string;
    /** Converts the raw stored value to a ThemeSpec.storedValue. */
    parseStoredValue: (raw: string) => string;
    /** Server-side save request. None exists: toggling makes no network call. */
    preferenceApi?: PreferenceApi;
    /** Whether logging out clears the preference. */
    clearedOnLogout: boolean;
  };
  /**
   * The app keeps its login session in sessionStorage (not cookies), which Playwright's storageState
   * does not capture. These keys are saved by auth.setup.ts and re-seeded by the context fixture.
   */
  authSessionStorageKeys: RegExp;
  /** WCAG 2.x AA: 4.5:1 normal text, 3:1 large text (>= 24px, or >= 18.66px bold). */
  minContrastRatio: number;
  minContrastRatioLargeText: number;
};

export const APP: AppConfig = {
  routes: {
    login: '/#/login',
    dashboard: '/#/dashboard/overview',
    report: '/#/dashboard/reports',
    themeStudio: '/#/dashboard/theme-studio',
  },
  urlPatterns: {
    login: /#\/login/,
    dashboard: /#\/dashboard\/overview/,
    report: /#\/dashboard\/reports/,
  },
  baselineThemeId: 'light',
  defaultThemeId: 'light', // observed on first login; re-confirm with a cleared localStorage
  persistence: {
    kind: 'localStorage',
    // Zustand-persist store written by Theme Studio: {"state":{"settings":{"mode":"dark",...}},"version":0}
    storageKey: 'omnieye-theme-studio',
    parseStoredValue: (raw) => {
      try {
        return String(JSON.parse(raw)?.state?.settings?.mode ?? '');
      } catch {
        return '';
      }
    },
    preferenceApi: undefined,
    clearedOnLogout: false, // not yet verified: logout control not explored
  },
  authSessionStorageKeys: /^omnieye_auth_/,
  minContrastRatio: 4.5,
  minContrastRatioLargeText: 3,
};
