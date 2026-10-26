# Theme Update & Report Module Validation (OomniEye staging)

Playwright + TypeScript suite that verifies a theme change is applied, persisted, and consistent
between the Dashboard and the Report Module.

## Prerequisites

- Node.js 18+
- Access to the staging environment

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env        # then fill in OOMNI_USERNAME / OOMNI_PASSWORD
```

Credentials are read only from environment variables (`config/env.ts`). `.env` and `.auth/` are git-ignored.

## Run

| Command | What it does |
| --- | --- |
| `npm test` | Full suite (setup → main specs → session spec) |
| `npm run test:th` | TH-01 to TH-08 only |
| `npm run test:edge` | Edge cases E-01 to E-03 |
| `npx playwright test --project=session` | E-04 (logout/login) on its own |
| `npm run report` | Open the HTML report (`playwright-report/`) |
| `npm run typecheck` | TypeScript check |
| `npm run todo:explore` | List any remaining placeholders |

Execution evidence: HTML report in `playwright-report/`, machine-readable results in
`test-results/results.json`, and on failure a screenshot, video and trace per test.
Passing tests also attach masked screenshots and TH-07 contrast measurements (JSON).

## Project structure

```
config/        env.ts (credentials), app.config.ts (routes, persistence facts), themes.ts (theme test data), paths.ts
pages/         BasePage (app shell + theme assertions), DashboardPage, ReportPage, LoginPage
pages/components/ThemeSwitcher.ts   theme control, waits on the save response instead of sleeping
fixtures/test.ts   page-object fixtures, auto baseline-theme reset, uncaught page-error capture
utils/         themeAssertions (web-first theme checks), contrast (WCAG ratio), storage, evidence
tests/         auth.setup.ts, theme-report.spec.ts (TH-01..08), theme-edge-cases.spec.ts (E-01..03), session.spec.ts (E-04)
docs/          exploration-notes.md, test-cases.md, defect-report-template.md
```

## What was found during exploration

See `docs/exploration-notes.md` for the full write-up.

- The app has two modes, **Light** and **Dark**, switched by the header toggle "Switch to Dark/Light Mode".
- The active mode is shown as `<html data-theme-mode="...">`, and the palette is set as inline CSS variables on `<html>`.
- The preference is stored in **localStorage** under `omnieye-theme-studio` (a Zustand store, field `state.settings.mode`). No network request is made.
- The login session lives in **sessionStorage**, which shapes both the auth setup and TH-06.

Deliverables:

| Deliverable | Where |
| --- | --- |
| Source code, POM, config | `config/`, `pages/`, `fixtures/`, `utils/`, `tests/` |
| Exploration and requirement analysis | `docs/exploration-notes.md` |
| Test scenarios and test cases | `docs/test-cases.md` |
| Defect report with RCA and fixes | `docs/defect-report.md` |
| Execution report | `playwright-report/` after `npm test`, summarised in `docs/execution-summary.md` |

Remaining placeholder: the logout control (`npm run todo:explore`), needed only for E-04.

## Design decisions

- **Assert what the app actually renders.** Theme checks use `toHaveClass` / `toHaveCSS` on computed styles from
  `config/themes.ts`, so a component that ignores the theme fails even when a root class flips.
- **No fixed waits.** Web-first assertions retry through CSS transitions; theme saves are awaited via
  `waitForResponse` on the preference API; ambiguous end states use `expect.poll`.
- **Serial execution on purpose.** All tests share one staging account and the theme is per-user state, so parallel
  workers would corrupt each other. Each test is still independent: an auto fixture resets the baseline theme first.
- **sessionStorage login.** Playwright's `storageState` ignores sessionStorage, where this app keeps its session.
  `auth.setup.ts` saves those keys and the `context` fixture re-seeds them once per tab, so a later logout is not undone.
- **Clean theme state.** The saved login state has the theme store stripped, so no test inherits whatever theme was
  active at login time.
- **Assertions on the real DOM.** `data-theme-mode` on `<html>` plus computed colours of header, body text and table
  cells. `body` background is deliberately not asserted (it is transparent right after toggling on Dashboard).
- **Soft assertions for readability.** TH-07 and the DEF-05 check use `expect.soft`, so one run reports every
  contrast problem with exact colours and ratios instead of stopping at the first.
- **Credentials stay out of artifacts.** Login runs only in the `setup` and `session` projects, both with trace,
  screenshot and video disabled. Evidence screenshots mask the user menu.
- **Logout runs last.** Logging out may revoke the shared saved session, so E-04 lives in a separate project that
  depends on the main one. Note: if any main test fails, Playwright skips dependent projects; run
  `--project=session` separately in that case.
- **Failure simulation that matches the app.** There is no preference API to fail, so TH-08a makes the localStorage
  write throw, and TH-08b injects an unsupported mode into the stored settings.

## Scenario coverage

See `docs/test-cases.md` for steps and expected results.

| ID | Scenario | Automated in |
| --- | --- | --- |
| TH-01 | Change theme from Dashboard | theme-report.spec.ts |
| TH-02 | Report Module reflects selection | theme-report.spec.ts |
| TH-03 | Persistence after Report refresh | theme-report.spec.ts |
| TH-04 | Dashboard ↔ Report navigation, browser back/forward | theme-report.spec.ts |
| TH-05 | Second change, latest wins | theme-report.spec.ts |
| TH-06 | Direct URL / new tab | theme-report.spec.ts (depends on persistence kind) |
| TH-07 | Readability: visibility, enabled state, WCAG contrast, dialog theming | theme-report.spec.ts (one test per theme) |
| TH-08a | Preference save returns 500 | theme-report.spec.ts (needs preference API) |
| TH-08b | Unsupported stored value | theme-report.spec.ts (needs client-side storage) |
| E-01 | Re-select active theme | theme-edge-cases.spec.ts |
| E-02 | Rapid switching / out-of-order saves | theme-edge-cases.spec.ts |
| E-03 | Fresh browser session (other device) | theme-edge-cases.spec.ts |
| E-04 | Logout → login | session.spec.ts |

## Known limitations

- Theme Studio colour presets (e.g. "Emerald") and its advanced settings are not automated. The assignment's
  "theme" was interpreted as the light/dark mode exposed to a general user. Presets could be added as further
  `ThemeSpec` entries.
- E-04 (logout → login) is `fixme` until the logout control is confirmed.

- Contrast measurement uses the nearest opaque ancestor background; gradients, images and semi-transparent layers
  are not composited, so those elements may need a manual check.
- Playwright's automatic failure screenshots cannot be masked; they may show the signed-in user's name in the header.
- Only Chromium is configured; add Firefox/WebKit projects if cross-browser theming is in scope.
