import { expect, Locator, Page } from '@playwright/test';
import { Surface, ThemeSpec } from '../config/themes';

export type SurfaceMap = Partial<Record<Surface, Locator>>;

function classRegex(className: string): RegExp {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`);
}

/**
 * Web-first assertion that `theme` is applied to the given surfaces.
 * toHaveClass / toHaveCSS retry until the expect timeout, so CSS transitions and async
 * theme loading are handled without fixed waits.
 */
export async function assertThemeApplied(
  page: Page,
  surfaces: SurfaceMap,
  theme: ThemeSpec,
  context: string,
): Promise<void> {
  const applicableStyles = (theme.styles ?? []).filter((s) => surfaces[s.surface]);
  if (!theme.rootMarker && applicableStyles.length === 0) {
    throw new Error(
      `Theme "${theme.id}" has no verifiable markers for surfaces [${Object.keys(surfaces).join(', ')}]. ` +
        'Fill rootMarker and/or styles in config/themes.ts from exploration before running theme assertions.',
    );
  }

  if (theme.rootMarker) {
    const { selector, className, attribute } = theme.rootMarker;
    const marker = page.locator(selector).first();
    if (className) {
      await expect(marker, `[${context}] ${selector} should have class "${className}" for theme "${theme.id}"`).toHaveClass(
        classRegex(className),
      );
    }
    if (attribute) {
      await expect(
        marker,
        `[${context}] ${selector} should have ${attribute.name}="${attribute.value}" for theme "${theme.id}"`,
      ).toHaveAttribute(attribute.name, attribute.value);
    }
  }

  for (const style of applicableStyles) {
    await expect(
      surfaces[style.surface]!,
      `[${context}] ${style.surface} ${style.property} should be ${style.value} for theme "${theme.id}"`,
    ).toHaveCSS(style.property, style.value);
  }
}

/** Non-retrying check of the current state. Use inside expect.poll or for branching, never as a final assertion. */
export async function isThemeApplied(page: Page, surfaces: SurfaceMap, theme: ThemeSpec): Promise<boolean> {
  if (theme.rootMarker) {
    const { selector, className, attribute } = theme.rootMarker;
    const marker = page.locator(selector).first();
    if (className) {
      const classes = ((await marker.getAttribute('class')) ?? '').split(/\s+/);
      if (!classes.includes(className)) return false;
    }
    if (attribute && (await marker.getAttribute(attribute.name)) !== attribute.value) return false;
  }
  for (const style of theme.styles ?? []) {
    const locator = surfaces[style.surface];
    if (!locator || !(await locator.isVisible())) continue;
    const actual = await locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), style.property);
    if (actual !== style.value) return false;
  }
  return true;
}
