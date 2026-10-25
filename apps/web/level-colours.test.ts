// Level colours: every level has its ink, tint and strong colour in each theme from tokens.json, its code reads
// clearly (WCAG contrast at least 4.5:1) on its tint in a badge, and levels.css hands each level's colours to its
// elements.
import { expect, test } from "bun:test";
import { LEVEL_INFO } from "../../scripts/lib.ts";
import { levelColours, levelColoursCss } from "./level-colours.ts";
import { THEMES } from "./tokens.ts";

// Relative luminance of a hex colour, and the WCAG contrast of two luminances.
const luminance = (hex: string): number => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

test.each([...THEMES])("every level has its three colours in the %s theme, as hex", (theme) => {
  const colours = levelColours(theme);
  expect(Object.keys(colours)).toEqual(LEVEL_INFO.map((l) => l.code));
  for (const tones of Object.values(colours)) for (const colour of Object.values(tones)) expect(colour).toMatch(/^#[0-9a-f]{6}$/);
});

test.each([...THEMES])("in the %s theme every level's code reads clearly on its tint", (theme) => {
  for (const [code, tones] of Object.entries(levelColours(theme))) {
    expect({ code, badge: contrast(tones.ink, tones.tint) >= 4.5 }).toEqual({ code, badge: true });
  }
});

test("levels.css hands each level's colours to its elements", () => {
  expect(levelColoursCss()).toContain(
    ".lvl-A1 { --lvl: var(--lvl-A1-ink); --level-tint: var(--lvl-A1-tint); --level-strong: var(--lvl-A1-strong); }",
  );
});
