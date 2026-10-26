# Test cases

**Precondition for all cases:** signed in as the general user, with the Dashboard (`#/dashboard/overview`) open and the Light theme applied. The `baselineTheme` fixture does this automatically.

**Theme verification in every case:**
- `<html data-theme-mode>` equals the expected mode, and
- computed colours of the header, body text and (on Report) table header and cells match `config/themes.ts`.

| ID | Steps | Expected result |
| --- | --- | --- |
| TH-01 | Click "Switch to Dark Mode" on Dashboard | `data-theme-mode=dark`; dark colours applied; toggle now reads "Switch to Light Mode"; localStorage `mode` is `dark` |
| TH-02 | Switch to dark → open Report Builder from the sidebar | Report shell and table use dark colours |
| TH-03 | TH-02, then reload | Dark is kept; stored mode is still `dark` |
| TH-04 | Switch to dark → Report → Dashboard → browser Back → browser Forward | Dark at every step |
| TH-05 | Switch to dark → Report → switch to light on Report → Dashboard → Report | Report shows Light, the latest selection; stored mode is `light` |
| TH-06 | Switch to dark → open Report by URL in the same tab, then in a new tab | Same tab: dark. New tab: stored dark theme is applied. The session should be kept; it is not (DEF-05) |
| TH-07 | For each mode: open Report; check heading, table header and cell, active sidebar item, section label, New User, view selector, page input; open the Filter dialog; open the View menu | All visible; button enabled; input editable; text contrast at least 4.5:1 (3:1 for large text) |
| TH-08a | Make localStorage writes of the theme key throw → toggle | UI keeps the old theme or shows an error; after reload the old theme is shown; no uncaught exception |
| TH-08b | Write an unsupported `mode` into the stored theme → reload | Default (light) theme shown; toggle usable; no uncaught exception |
| E-01 | Toggle dark and back | No write request is sent (client-only persistence) |
| E-02 | Toggle 5 times quickly → reload → open Report | Ends on dark everywhere; stored mode is `dark` |
| E-03 | Open the app in a browser with no stored theme | Default (light) theme |
| E-04 | Switch to dark → logout → login | Dark kept, since localStorage is not cleared. **fixme:** logout control not located |

**Not automated:**
- Theme Studio presets and advanced settings.
- Visual polish of charts and video.
- Focus-ring visibility and hover states.
- Colour accuracy inside the Theme Studio live preview.
