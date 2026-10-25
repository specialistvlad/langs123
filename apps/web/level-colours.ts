// Level colours: each level's ink, tint, strong, pill and pill ink colour in each theme, from tokens.json (tokens.ts).
// Ink writes a level's code on its tint; strong fills the level's bar in a level mark; a level pill writes the code in
// pill ink on the pill colour. style.css sets their variables (--lvl-A1-ink…) with the other tokens; levels.css hands
// a level's to its elements.
import { LEVEL_INFO } from "../../scripts/lib.ts";
import { type Theme, token } from "./tokens.ts";

export const TONES = ["ink", "tint", "strong", "pill", "pill-ink"] as const;
export type Tone = (typeof TONES)[number];

// Every level's colours in a theme.
export function levelColours(theme: Theme): Record<string, Record<Tone, string>> {
  return Object.fromEntries(
    LEVEL_INFO.map((l) => [l.code, Object.fromEntries(TONES.map((t) => [t, token(`level-${l.code.toLowerCase()}-${t}`, theme)]))]),
  ) as Record<string, Record<Tone, string>>;
}

// The rule that hands a level's colours to its elements: --lvl (ink), --level-tint, --level-strong, --level-pill and
// --level-pill-ink.
export const levelColoursCss = (): string =>
  LEVEL_INFO.map(
    ({ code }) =>
      `.lvl-${code} { --lvl: var(--lvl-${code}-ink); --level-tint: var(--lvl-${code}-tint); --level-strong: var(--lvl-${code}-strong); --level-pill: var(--lvl-${code}-pill); --level-pill-ink: var(--lvl-${code}-pill-ink); }`,
  ).join("\n");
