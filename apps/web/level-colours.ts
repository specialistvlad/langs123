// Level colours: each level's ink, tint and strong colour in each theme, from tokens.json (tokens.ts). Ink writes a
// level's code; tint lies behind the code in a pill; strong fills the level's bar in a level mark. style.css sets
// their variables (--lvl-A1-ink…) with the other tokens; levels.css hands a level's to its elements.
import { LEVEL_INFO } from "../../scripts/lib.ts";
import { type Theme, token } from "./tokens.ts";

export const TONES = ["ink", "tint", "strong"] as const;
export type Tone = (typeof TONES)[number];

// Every level's ink, tint and strong colour in a theme.
export function levelColours(theme: Theme): Record<string, Record<Tone, string>> {
  return Object.fromEntries(
    LEVEL_INFO.map((l) => [l.code, Object.fromEntries(TONES.map((t) => [t, token(`level-${l.code.toLowerCase()}-${t}`, theme)]))]),
  ) as Record<string, Record<Tone, string>>;
}

// The rule that hands a level's colours to its elements: --lvl (ink), --level-tint and --level-strong.
export const levelColoursCss = (): string =>
  LEVEL_INFO.map(
    ({ code }) =>
      `.lvl-${code} { --lvl: var(--lvl-${code}-ink); --level-tint: var(--lvl-${code}-tint); --level-strong: var(--lvl-${code}-strong); }`,
  ).join("\n");
