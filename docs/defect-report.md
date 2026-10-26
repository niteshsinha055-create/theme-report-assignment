# Defect report

**Environment:** OomniEye staging (`base-application-stage.oomnieye.com`), Chrome, general user, 26 Oct 2026.

**How defects were found:** manual exploration, with a WCAG 2.x contrast scan of every visible text node, run in the browser. Ratios use the nearest ancestor with an opaque background. Where a gradient sits behind the text the ratio is approximate; this is flagged per item. The automated suite (TH-07) re-measures these items on every run and attaches the values as JSON.

| ID | Title | Severity | Mode | Related test |
| --- | --- | --- | --- | --- |
| DEF-01 | Active sidebar item unreadable in Light mode | Major | Light | TH-07 [light] |
| DEF-02 | Accent-coloured text in Report filter dialog and menus below contrast minimum in Light mode | Major | Light | TH-07 [light] |
| DEF-03 | Sidebar section labels below contrast minimum in both modes | Minor | Both | TH-07 |
| DEF-04 | Employment-type status chips below 4.5:1 in Light mode | Minor (to confirm) | Light | Manual |
| DEF-05 | Report Module opened in a new tab forces re-login despite "Remember me" | Major | Both | TH-06 |
| DEF-06 | Filter dialog is not an accessible dialog and ignores Escape | Minor | Both | Manual / POM note |
| DEF-07 | Unsupported stored theme mode is applied verbatim and breaks sidebar styling | Medium | n/a | TH-08b |
| DEF-08 | Failed preference save is silent: UI shows new theme, reload reverts it, uncaught exception | Medium | Both | TH-08a |

---

## DEF-01: Active sidebar item unreadable in Light mode

- **Severity / impact:** Major. The label of the page you are on ("Report Builder") is barely visible, which is a core navigation cue. It fails WCAG 1.4.3.
- **Steps to reproduce:**
  1. Sign in.
  2. Switch to Light mode.
  3. Click "Report Builder" in the sidebar.
- **Expected:** Active item text has at least 4.5:1 contrast against its highlight.
- **Actual:** Text `rgb(46, 230, 166)` (`--highlight` `#2EE6A6`) on a pale mint highlight. The ratio is about **1.6:1**; it's approximate because there is a gradient behind it.
- **Evidence:** contrast scan (label "Report Builder", ratio 1.62); TH-07 [light] attachment `TH-07-contrast-light.json`.
- **Root cause:** The active-item style uses the highlight colour, which is tuned for the dark sidebar, as foreground in both modes. Light mode has no darker variant.
- **Recommended fix:** Add a mode-aware token, e.g. `--nav-active-text`. In light mode use a dark green such as `#047857` (about 5.5:1 on white), or keep the bright highlight only as the background or indicator bar.

## DEF-02: Accent-coloured text below contrast minimum in Light mode (Report filter dialog, menus)

- **Severity / impact:** Major. Interactive text in the Report filter is hard to read in Light mode.
- **Steps to reproduce:**
  1. Light mode.
  2. Go to Report Builder and click Filter.
  3. Look at "+ Add condition".
  4. Click it, then look at the "AND" selector and the highlighted option in the column dropdown.
  5. Click Close with a condition present to see the "Unsaved changes" title.
- **Expected:** Text at least 4.5:1, or at least 3:1 for the 20px "Unsaved changes" title if it counts as large text.
- **Actual:** `rgb(16, 185, 129)` (`--primary` `#10B981`) on white or near-white:
  - "+ Add condition": **2.54:1**
  - "AND": **2.54:1**
  - Selected "User id" option: **2.44:1**
  - "Unsaved changes" title (20px, not bold): **2.54:1**
- **Root cause:** In Dark mode the theme swaps `--primary` to the lighter `#85e0c2`. In Light mode the brand colour `#10B981` is used directly as a *text* colour, and it's only suitable as a fill. One token is serving both as fill colour and text colour.
- **Recommended fix:** Introduce `--primary-text` (or use MUI `palette.primary.dark` for text) with a darker value in Light mode, e.g. `#047857`. Keep `#10B981` for fills and icons with white text checked separately.

## DEF-03: Sidebar section labels below contrast minimum in both modes

- **Severity / impact:** Minor. These are non-interactive group labels ("REPORTS", "SYSTEM") and the "Collapse" control.
- **Actual:** `rgba(102, 112, 146, 0.7)`:
  - Light mode: about **2.8:1**
  - Dark mode: about **2.5:1**
- **Root cause:** One muted grey with 70% opacity is used in both modes, with no per-mode token.
- **Recommended fix:** Use `--text-secondary` from the theme, which is `rgba(0,0,0,0.7)` / `rgba(255,255,255,0.74)` and passes in both modes. At minimum, drop the extra opacity. "Collapse" is a control, so it needs at least 4.5:1 for its text.

## DEF-04: Employment-type status chips below 4.5:1 in Light mode (to confirm)

- **Severity / impact:** Minor.
- **Actual:**
  - "Contract" `rgb(2, 136, 209)`: **3.86:1**
  - "Part Time" `rgb(183, 113, 1)`: **3.91:1**
  - "Full Time" `rgb(42, 141, 47)`: **4.24:1**
  - These were measured against a white background. The chip has a tinted, semi-transparent background, so the real ratio may be a little lower.
- **Root cause:** Status colours (`--info`, `--secondary-hover`, `--success`) are used as text on light tints without darkening.
- **Recommended fix:** Use darker shades for chip text in Light mode, e.g. `#01579b`, `#8a5500`, `#1b5e20`.

## DEF-05: Report Module opened in a new tab forces re-login despite "Remember me"

- **Severity / impact:** Major for usability. Deep links and "open in new tab" don't work for signed-in users. It also stops TH-06 from showing the Report in a new tab.
- **Steps to reproduce:**
  1. Sign in with "Remember me" checked.
  2. Open `#/dashboard/reports` in a new tab.
- **Expected:** The Report Module opens, signed in, in the stored theme.
- **Actual:** Redirected to `#/login`. The *theme* is correctly applied on the login page (dark, from localStorage), so theme behaviour itself is consistent.
- **Root cause:** The session flag lives in `sessionStorage` (`omnieye_auth_session`), which is per-tab. "Remember me" only stores the email in localStorage.
- **Recommended fix:** Store the session in an HttpOnly cookie, or a token in localStorage when "Remember me" is set. Preserve the requested route and redirect back to it after login.

## DEF-06: Filter dialog is not an accessible dialog and ignores Escape

- **Severity / impact:** Minor (accessibility and testability).
- **Actual:**
  - The "Filter columns" overlay has no `role="dialog"` or `aria-modal`.
  - Pressing Escape does nothing.
  - Its title is a second `<h1>` on the page.
  - Meanwhile a hidden help widget *does* carry `role="dialog"`, so assistive tech and tests find the wrong dialog.
  - Other unnamed controls: the avatar button and the rows-per-page combobox.
- **Recommended fix:**
  - Render the filter dialog with MUI `Dialog` (role, focus trap, Escape) and label it with the title, using an `h2`.
  - Hide the help widget from the accessibility tree when it is closed.
  - Add `aria-label`s to the avatar button and the rows-per-page combobox.

## DEF-07: Unsupported stored theme mode is applied verbatim and breaks sidebar styling

- **Severity / impact:** Medium.
  - The trigger is rare: a corrupted or hand-edited value, an older or newer app version writing a different mode name, or a Theme Studio import.
  - The result is visibly broken UI.
- **Steps to reproduce:**
  1. In DevTools → Application → localStorage, edit `omnieye-theme-studio` and set `state.settings.mode` to `"unsupported-mode-xyz"`.
  2. Reload.
  3. Sign in if prompted, and look at the Dashboard.
- **Expected:** The app rejects the unknown value, falls back to the default (light), and rewrites the stored value.
- **Actual:**
  - `<html data-theme-mode="unsupported-mode-xyz">` is set as-is, and the stored value is not corrected.
  - The palette variables fall back to light, but styles keyed on the mode are lost. The sidebar background disappears and all sidebar links render in the browser-default link blue `rgb(0, 0, 238)`. In light mode they are the theme text colour.
  - The toggle offers "Switch to Dark Mode", and clicking it recovers correctly to dark.
  - No console errors.
- **Evidence:**
  - Login page with the invalid mode: `screenshot-1792992097476-0.jpg`
  - Sidebar with default blue links: `screenshot-1792992181329-1.png`
  - Both are in the Claude-in-Chrome temp screenshot folder.
- **Root cause:**
  - The persisted Zustand store is rehydrated without validating `settings.mode` against the allowed values (light/dark).
  - Components compute "is dark" as `mode === 'dark'`, so the palette defaults to light.
  - But CSS or styled rules that match `[data-theme-mode="light"]` (or the light branch of a switch) do not match, so those rules are skipped.
- **Recommended fix:**
  - Validate on rehydrate with Zustand persist's `migrate`/`merge`, or a schema such as zod. Coerce an unknown `mode` to the default and write it back.
  - Derive the `data-theme-mode` attribute from the validated value only.

## DEF-08: Failed preference save is silent and inconsistent

- **Severity / impact:** Medium.
  - Users in private browsing, with full storage, or with storage blocked by policy see their theme change "work" and then silently revert on the next load.
  - An uncaught exception is thrown, which an error tracker would report as a crash.
- **Steps to reproduce:**
  1. Signed in, Dark mode.
  2. In the console, make `localStorage.setItem` throw `QuotaExceededError` for the key `omnieye-theme-studio`.
  3. Click "Switch to Light Mode".
  4. Restore `setItem` and reload.
- **Expected:** Either the change is applied *and* the user is told it could not be saved for next time, or the toggle is rolled back. In both cases there is no uncaught exception.
- **Actual:**
  - The UI switches to light (`data-theme-mode=light`) while storage still says `dark`.
  - No message is shown.
  - The console shows an uncaught `QuotaExceededError` thrown from the persistence layer (`index-*.js`).
  - After reload the app is dark again, so the user's choice is lost.
- **Evidence:** UI in light while stored mode is dark: `screenshot-1792992202790-2.jpg`. The console exception was captured during the check.
- **Root cause:** The persist storage adapter calls `localStorage.setItem` without try/catch. The in-memory state is updated first, so the UI and the stored state diverge when the write fails.
- **Recommended fix:**
  - Wrap writes in a safe storage adapter (`createJSONStorage` with a try/catch around `setItem`).
  - On failure, keep the in-memory theme for the session but show a non-blocking notice ("Theme couldn't be saved for next time").
  - Report the error as handled, not as an uncaught exception.

---

## Observations (not defects)

- `body` background reads `transparent` right after toggling to dark on the Dashboard, and `rgb(18, 18, 18)` after navigating. There's no visible impact, but it shows the background is driven by an inner container rather than `body`.
- The header background has a 0.2s CSS transition, so colours read mid-transition differ briefly (seen as `rgb(9, 33, 25)`). Web-first `toHaveCSS` retries past this.
- The header stays dark green in Light mode. That looks like a deliberate brand choice, so it's not reported.
- The theme is stored per browser, not per account. Acceptable for a prototype; flag it if the product expects the theme to follow the user across devices.
