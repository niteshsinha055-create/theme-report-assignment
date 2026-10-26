# Exploration notes (Task 1)

Explored on 26 Oct 2026 in Chrome, signed in as the general (customer) user. No credentials appear in these notes.

## Application map

| Module | Route | How reached |
| --- | --- | --- |
| Login | `#/login` | Redirect when no session |
| Dashboard (overview) | `#/dashboard/overview` | Sidebar "Dashboard"; `#/dashboard/` redirects here |
| Report Module ("Report Builder") | `#/dashboard/reports` | Sidebar "Report Builder" (under REPORTS) |
| Theme Studio | `#/dashboard/theme-studio` | Sidebar "Theme Studio" (under SYSTEM) |
| Account Settings | `#/dashboard/account` | Sidebar "Account Settings" |

## Theme settings

- **Supported options:** two modes, **Light** and **Dark**.
  - Header toggle button. Its title and accessible name is "Switch to Dark Mode" or "Switch to Light Mode", naming the mode it switches *to*.
  - Theme Studio also has a "Switch to light/dark" button and a "Reset to defaults" button.
- **Colour presets:** Theme Studio also offers presets (current one: "Emerald") plus many fine-grained settings (colours, typography, cards, tables, surface & shape, notifications, login screen). Presets change the accent palette, not the light/dark mode. They were not exercised; see Limitations.
- **When it applies:** instantly, with no Save step.
- **Default for this user:** Light, observed on first login.

## How a theme is applied (DOM)

- `<html data-theme-mode="light|dark">` is the authoritative marker. There is **no** `data-theme` attribute and no theme class on `<body>`.
- The palette is written as inline CSS custom properties on `<html style="...">`. Examples:
  - `--page-bg`: `#ffffff` in light, `#121212` in dark.
  - `--bg-card`: `#ffffff` / `#212121`.
  - `--text-primary`: `rgba(0,0,0,0.92)` / `rgba(255,255,255,0.96)`.
  - `--primary`: `#10B981` in light, but `#85e0c2` in dark (a lighter variant is used for dark).
- The SideeX recorder Chrome extension was active during exploration and blocked scripted access in one tab; checks were repeated in a clean tab.
- UI is MUI (Material UI) plus custom `dash-*` shell classes: `header.dash-header` and `aside.dash-sidebar`.

Computed colours used as assertions:

| Surface | Light | Dark |
| --- | --- | --- |
| `body` text colour | `rgba(0, 0, 0, 0.92)` | `rgba(255, 255, 255, 0.96)` |
| `header.dash-header` background | `rgb(13, 42, 32)` | `rgb(4, 22, 16)` |
| Report table header cell background | `rgba(46, 230, 166, 0.14)` | `rgba(46, 230, 166, 0.22)` |
| Report table header/body text | `rgba(0, 0, 0, 0.92)` | `rgba(255, 255, 255, 0.96)` |
| `body` background | `rgb(255, 255, 255)` | `rgb(18, 18, 18)` after navigation, but `transparent` right after toggling on Dashboard. Not asserted. |

The header stays dark green in both modes. That appears to be intentional branding.

## How the preference is persisted

- **localStorage**, key `omnieye-theme-studio`.
  - It's a Zustand-persist store: `{"state":{"settings":{"mode":"dark","presetId":"emerald",...},"savedThemes":...},"version":0}`.
- **No network request** is made when toggling. The network log was empty apart from a `data:` URL, so there is no server-side preference.
- Because the preference lives in localStorage:
  - it is per-browser, not per-account;
  - it is shared across tabs of the same browser;
  - it persists across reloads;
  - it is lost in a different browser or device.

## Session handling (affects automation and TH-06)

- The login session is kept in **sessionStorage** (`omnieye_auth_session`, `omnieye_auth_role`, `omnieye_auth_email`). It is not in cookies.
- Consequence for the app: a new tab has empty sessionStorage, so opening any app URL in a new tab redirects to `#/login`. This happens even with "Remember me" checked (DEF-05).
- Consequence for Playwright: `storageState` does not include sessionStorage. The suite therefore saves these keys in `auth.setup.ts` and re-seeds them with an init script (`utils/storage.ts`).

## Report Module

- Elements:
  - H1 "Reports" with a breadcrumb "Test".
  - A "New User" (+) button.
  - Toolbar: "View: Default View", Search, Sort, Filter, Show/Hide Columns, List view, Grid view, More actions.
  - An MUI table of 1000 users, 15 per page. Columns include User id, Full name, Username, Email, Phone number, Department, Role, and employment-type status chips.
  - Pagination: First/Previous/Next/Last, a "Page number" textbox, and a rows-per-page combobox.
- **Filter dialog ("Filter columns"):**
  - It's an MUI Paper overlay with **no `role="dialog"`**.
  - Escape does not close it.
  - Closing with unsaved conditions opens a nested "Unsaved changes" confirmation.
- **Dropdowns/menus** render in MUI popover portals under `<body>`. They follow the theme because MUI reads it from context.
- **Hidden help window:** there is a help widget with `role="dialog"` and class `bg-white`, always present in the DOM. Locators must not use `getByRole('dialog')` blindly.

## Manual checks performed (Task 2)

| Check | Result |
| --- | --- |
| Toggle Light → Dark on Dashboard | Applied immediately; `data-theme-mode=dark`; stored `mode:"dark"` |
| Navigate to Report Module | Dark applied to shell, table, header cells, toolbar |
| Toggle Dark → Light on Report Module | Applied immediately; stored `mode:"light"` |
| Reload Report Module | Theme kept (toggle reads "Switch to Light Mode" after reload in dark) |
| Navigate Dashboard → Account Settings → Report | Theme kept on every page |
| Open Report URL directly in the same tab | Theme kept |
| Open Report URL in a new tab | Redirected to login (DEF-05); the login page *is* rendered in the stored dark theme |
| Filter dialog, nested confirmation dialog, column dropdown | Themed correctly in both modes; contrast problems in light (DEF-02) |
| TH-04 exact path, via sidebar clicks plus browser history | Dark kept at Dashboard → Report → Dashboard → Back (Report) → Forward (Dashboard). `data-theme-mode`, header `rgb(4, 22, 16)`, body text and table colours all match the config |
| TH-08a: make the localStorage write throw, then toggle | UI switches to light while storage keeps dark; no message; uncaught `QuotaExceededError`; reload reverts to dark (DEF-08) |
| TH-08b: unsupported stored mode, then reload | `data-theme-mode` takes the invalid value; sidebar loses styling (links in default blue); no console errors; toggle recovers (DEF-07) |
| E-01: network while toggling | No requests at all |
| E-02: 5 rapid toggles, then reload | Ends on the opposite mode as expected; stored value matches; kept after reload |
| Readability scan of all visible text (WCAG ratio) | Light: several items below 4.5:1 (DEF-01, -02, -03, -04). Dark: only sidebar section labels (DEF-03) |

## Assumptions and open questions

- The default theme for a new browser is assumed to be Light, as observed. The automation verifies it in E-03.
- **Logout:** the control was not located; it is probably in the avatar menu. E-04 is marked `fixme`.
- **Presets and the other Theme Studio settings:** these are outside the light/dark scope the assignment describes. Confirm with the hiring team whether presets count as "themes".
- **Persistence location:** per-browser storage may be intended for this prototype. If the product expects the theme to follow the user account, that is a gap.
