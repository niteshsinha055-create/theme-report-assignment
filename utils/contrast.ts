import { Locator } from '@playwright/test';

export interface ContrastResult {
  label: string;
  foreground: string;
  background: string;
  fontSize: string;
  largeText: boolean;
  /** True when a background-image (gradient) sits behind the text, so the ratio is approximate. */
  approximate: boolean;
  /** NaN when a colour could not be parsed. */
  ratio: number;
}

/**
 * WCAG contrast between an element's text colour and its effective background: the nearest ancestor
 * whose background-color has alpha >= 0.5. Semi-transparent text is blended onto that background.
 * Handles both rgb()/rgba() and the color(srgb ...) syntax Chrome returns for some MUI surfaces.
 */
export async function measureContrast(locator: Locator, label: string): Promise<ContrastResult> {
  return locator.evaluate((el, label) => {
    type Rgba = { r: number; g: number; b: number; a: number };
    const parse = (v: string): Rgba | null => {
      let m = v.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      }
      m = v.match(/color\(srgb\s+([^)]+)\)/);
      if (m) {
        const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
        return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 };
      }
      return null;
    };
    const lum = ({ r, g, b }: Rgba) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const blend = (fg: Rgba, bg: Rgba): Rgba => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });

    const style = getComputedStyle(el);
    let bg: Rgba = { r: 255, g: 255, b: 255, a: 1 };
    let background = 'rgb(255, 255, 255) (default)';
    let approximate = false;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.backgroundImage !== 'none') approximate = true;
      const parsed = parse(s.backgroundColor);
      if (parsed && parsed.a >= 0.5) {
        bg = parsed;
        background = s.backgroundColor;
        break;
      }
    }
    const fontPx = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 700;
    const largeText = fontPx >= 24 || (bold && fontPx >= 18.66);
    const fgRaw = parse(style.color);
    if (!fgRaw) {
      return { label, foreground: style.color, background, fontSize: style.fontSize, largeText, approximate, ratio: Number.NaN };
    }
    const [hi, lo] = [lum(blend(fgRaw, bg)), lum(bg)].sort((a, b) => b - a);
    const ratio = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    return { label, foreground: style.color, background, fontSize: style.fontSize, largeText, approximate, ratio };
  }, label);
}
