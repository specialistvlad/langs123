// Level colours: every level's ink, tint and strong colour lies inside sRGB in both themes, keeps its
// level's hue, reads clearly (WCAG contrast at least 4.5:1) as a badge's code on its tint and as the chosen
// level button's text on its strong colour, and levels.css sets them in each theme's block. The hues run
// through the rainbow, lowest level first.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { LEVEL_INFO } from "../../scripts/lib.ts";
import { inSrgb, levelColours, levelColoursCss, linearRgb, type Oklch, TONES } from "./level-colours.ts";

const themes = Object.keys(TONES) as (keyof typeof TONES)[];

test.each(themes)("every level colour of the %s theme lies inside sRGB in its level's hue", (theme) => {
  const colours = levelColours(theme);
  for (const { code, hue } of LEVEL_INFO) {
    for (const [tone, colour] of Object.entries(colours[code] ?? {})) {
      expect({ code, tone, inside: inSrgb(colour), hue: colour[2] }).toEqual({ code, tone, inside: true, hue });
    }
  }
});

test("levels.css sets every level's colours in the light theme and in the dark theme", () => {
  const blocks = levelColoursCss().split("\n");
  const light = blocks.find((b) => b.startsWith(":root {")) ?? "";
  const dark = blocks.filter((b) => b.includes('data-theme="light"') || b.startsWith(':root[data-theme="dark"]'));
  expect(dark).toHaveLength(2);
  for (const [theme, texts] of [
    ["light", [light]],
    ["dark", dark],
  ] as const) {
    for (const [code, tones] of Object.entries(levelColours(theme))) {
      for (const [tone, [l, c, h]] of Object.entries(tones)) {
        for (const text of texts) expect(text).toContain(`--lvl-${code}-${tone}: oklch(${+(l * 100).toFixed(2)}% ${c} ${h});`);
      }
    }
  }
});

// Relative luminance of linear sRGB channels, and the WCAG contrast of two luminances.
const luminance = ([r = 0, g = 0, b = 0]: number[]): number => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const contrast = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const ofOklch = (c: Oklch): number => luminance(linearRgb(c).map((v) => Math.min(1, Math.max(0, v))));
const ofHex = (hex: string): number =>
  luminance(
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)),
  );
// The text colour of each theme in base.css: :root's, then the dark block's.
const base = await Bun.file(join(import.meta.dir, "styles", "base.css")).text();
const [lightText = "", darkText = ""] = [...base.matchAll(/--text: (#[0-9a-f]{6});/g)].map((m) => m[1] ?? "");
const textOf = { light: lightText, dark: darkText };

test.each(themes)("in the %s theme every level reads clearly on its tint and on its strong colour", (theme) => {
  for (const [code, tones] of Object.entries(levelColours(theme))) {
    const badge = contrast(ofOklch(tones.ink), ofOklch(tones.tint));
    const button = contrast(ofHex(textOf[theme]), ofOklch(tones.strong));
    expect({ code, badge: badge >= 4.5, button: button >= 4.5 }).toEqual({ code, badge: true, button: true });
  }
});

test("the levels run through the rainbow, lowest first", () => {
  const hues = LEVEL_INFO.map((l) => l.hue);
  expect(hues).toEqual([...hues].sort((a, b) => a - b));
  expect(new Set(hues).size).toBe(hues.length);
});
