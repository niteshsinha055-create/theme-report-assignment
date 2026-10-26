/**
 * Theme test data, taken from the live DOM on OomniEye staging.
 *
 * The app exposes a light/dark mode (header toggle, also in Theme Studio). The active mode is written to
 * <html data-theme-mode="light|dark"> and the palette is applied as inline CSS custom properties on <html>
 * (--page-bg, --text-primary, --primary, ...).
 *
 * body background-color is deliberately not asserted: right after toggling to dark on the Dashboard it read
 * transparent, while after navigation it read rgb(18, 18, 18). Text colour, header and table are stable. Colour presets (e.g. "Emerald") live in Theme Studio and
 * change the accent palette; they are not covered here (see README "Known limitations").
 */

export type Surface =
  | 'root'
  | 'body'
  | 'header'
  | 'sidebar'
  | 'content'
  | 'table'
  | 'tableHeader'
  | 'tableCell'
  | 'button'
  | 'input'
  | 'dialog';

export interface StyleExpectation {
  surface: Surface;
  property: 'background-color' | 'color' | 'border-color';
  /** Exactly as getComputedStyle returns it, e.g. 'rgb(18, 18, 18)'. */
  value: string;
}

export interface ThemeSpec {
  id: string;
  /** Accessible name fragment of the toggle that switches TO this theme ("Switch to Dark Mode"). */
  label: string;
  storedValue?: string;
  rootMarker?: { selector: string; className?: string; attribute?: { name: string; value: string } };
  styles?: StyleExpectation[];
}

export const THEMES: ThemeSpec[] = [
  {
    id: 'light',
    label: 'Light Mode',
    storedValue: 'light',
    rootMarker: { selector: 'html', attribute: { name: 'data-theme-mode', value: 'light' } },
    styles: [
      { surface: 'body', property: 'color', value: 'rgba(0, 0, 0, 0.92)' },
      { surface: 'header', property: 'background-color', value: 'rgb(13, 42, 32)' },
      { surface: 'tableHeader', property: 'background-color', value: 'rgba(46, 230, 166, 0.14)' },
      { surface: 'tableHeader', property: 'color', value: 'rgba(0, 0, 0, 0.92)' },
      { surface: 'tableCell', property: 'color', value: 'rgba(0, 0, 0, 0.92)' },
    ],
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    storedValue: 'dark',
    rootMarker: { selector: 'html', attribute: { name: 'data-theme-mode', value: 'dark' } },
    styles: [
      { surface: 'body', property: 'color', value: 'rgba(255, 255, 255, 0.96)' },
      { surface: 'header', property: 'background-color', value: 'rgb(4, 22, 16)' },
      { surface: 'tableHeader', property: 'background-color', value: 'rgba(46, 230, 166, 0.22)' },
      { surface: 'tableHeader', property: 'color', value: 'rgba(255, 255, 255, 0.96)' },
      { surface: 'tableCell', property: 'color', value: 'rgba(255, 255, 255, 0.96)' },
    ],
  },
];

export function themeById(id: string): ThemeSpec {
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) {
    throw new Error(`Theme "${id}" is not defined in config/themes.ts (known: ${THEMES.map((t) => t.id).join(', ')})`);
  }
  return theme;
}
