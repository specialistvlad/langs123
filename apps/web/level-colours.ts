// Level colours: each level's ink, tint, strong, pill and pill ink colour in each theme, from a design's tokens (tokens.ts).
// Ink writes a level's code on its tint; strong fills the level's bar in a level mark; a level pill writes the code in
// pill ink on the pill colour. style.css sets their variables (--c-level-a1-ink…) with the other tokens; levels.css hands
// a level's to its elements.
import { LEVEL_INFO } from "../../scripts/lib.ts";
import { DEFAULT_DESIGN, designTokens, type Theme, token } from "./tokens.ts";

export const TONES = ["ink", "tint", "strong", "pill", "pill-ink"] as const;
export type Tone = (typeof TONES)[number];

// Every level's colours in a theme, in a design.
export function levelColours(theme: Theme, design: string = DEFAULT_DESIGN): Record<string, Record<Tone, string>> {
  const colours = designTokens(design).color.tokens;
  return Object.fromEntries(
    LEVEL_INFO.map((l) => [l.code, Object.fromEntries(TONES.map((t) => [t, token(`level-${l.code.toLowerCase()}-${t}`, theme, colours)]))]),
  ) as Record<string, Record<Tone, string>>;
}

// The rule that hands a level's colours to its elements: --lvl (ink), --level-tint, --level-strong, --level-pill and
// --level-pill-ink.
export const levelColoursCss = (): string =>
  LEVEL_INFO.map(({ code }) => {
    const c = `--c-level-${code.toLowerCase()}`;
    return `.lvl-${code} { --lvl: var(${c}-ink); --level-tint: var(${c}-tint); --level-strong: var(${c}-strong); --level-pill: var(${c}-pill); --level-pill-ink: var(${c}-pill-ink); }`;
  }).join("\n");
