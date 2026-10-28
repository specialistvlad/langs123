// The look of the site and of every app the library feeds: tokens.json, the design system's tokens, the one source of
// every colour, shadow, type style, family, space, radius and layout measure the stylesheets read. Each token sets one
// variable, named by its group:
//   colour    --c-<token>                          --c-bg  --c-accent-line  --c-level-a1-pill-ink  --c-level-mark-fill
//   shadow    --sh-<token without shadow->         --sh-card  --sh-panel
//   type      --t-<style>-size|lh|weight|track     --t-body-size  --t-reading-body-lh  --t-label-track
//   family    --f-<family>                         --f-sans  --f-sans-uk  --f-mono
//   spacing   --s-<token without space->           space-16 is --s-16
//   radius    --r-<px>, --r-pill                   radius-xl (12px) is --r-12, radius-1_5 (1.5px) --r-1_5
//   layout    --bp-<name without breakpoint->      breakpoint-phone is --bp-phone; every other layout token keeps its
//             --<name>                             name: --measure  --content-width  --topbar-height
// The colours and the shadows whose two themes differ take their light values on :root and their dark ones under the two
// selectors of a reader's choice and the system's; every other variable stands on :root.
import file from "./tokens.json";

export interface Token {
  name: string;
  value: string | Record<string, string>;
}
interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight?: string | number;
  fontWeight?: string | number;
  letterSpacing?: string;
}
interface Measure {
  name: string;
  value: string;
}
export interface Tokens {
  color: { tokens: Token[] };
  shadow: { tokens: Token[] };
  type: { families: Record<string, string>; groups: { styles: TypeStyle[] }[] };
  spacing: { tokens: Measure[] };
  radius: { tokens: Measure[] };
  layout: { tokens: Measure[] };
}
const TOKENS = file as unknown as Tokens;
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const valueIn = (t: Token, theme: Theme): string | undefined => (typeof t.value === "string" ? t.value : t.value[theme]);
const without = (name: string, prefix: string): string => (name.startsWith(prefix) ? name.slice(prefix.length) : name);
const squash = (text: string): string => text.replace(/\s+/g, " ").trim();

// A colour token's value in a theme; every colour token has one in each.
export function token(name: string, theme: Theme, tokens: Token[] = TOKENS.color.tokens): string {
  const value = tokens.find((t) => t.name === name);
  const found = value === undefined ? undefined : valueIn(value, theme);
  if (found === undefined) throw new Error(`tokens.json has no ${theme} value for ${name}`);
  return found;
}

// The variable of a colour token, and of a shadow token.
export const colourVariable = (name: string): string => `--c-${name}`;
export const shadowVariable = (name: string): string => `--sh-${without(name, "shadow-")}`;

type Declaration = [string, string];

// The variables of the tokens: those on :root in either theme, and the light and dark values of the themed ones.
export function tokenVariables(t: Tokens = TOKENS): { root: Declaration[]; light: Declaration[]; dark: Declaration[] } {
  const themed = (s: Token): boolean =>
    typeof s.value !== "string" && squash(valueIn(s, "light") ?? "") !== squash(valueIn(s, "dark") ?? "");
  const shadows = t.shadow.tokens;
  const inTheme = (theme: Theme): Declaration[] => [
    ...t.color.tokens.map((c): Declaration => [colourVariable(c.name), token(c.name, theme, t.color.tokens)]),
    ...shadows.filter(themed).map((s): Declaration => [shadowVariable(s.name), squash(valueIn(s, theme) ?? "")]),
  ];
  const root: Declaration[] = [
    ...shadows.filter((s) => !themed(s)).map((s): Declaration => [shadowVariable(s.name), squash(valueIn(s, "light") ?? "")]),
    ...t.type.groups
      .flatMap((g) => g.styles)
      .flatMap((s): Declaration[] => [
        [`--t-${s.name}-size`, s.fontSize],
        [`--t-${s.name}-lh`, String(s.lineHeight ?? "normal")],
        [`--t-${s.name}-weight`, String(s.fontWeight ?? 400)],
        [`--t-${s.name}-track`, s.letterSpacing ?? "0"],
      ]),
    ...Object.entries(t.type.families).map(([name, value]): Declaration => [`--f-${name}`, squash(value)]),
    ...t.spacing.tokens.map((s): Declaration => [`--s-${without(s.name, "space-")}`, s.value]),
    ...t.radius.tokens.map((r): Declaration => [
      r.name === "radius-pill" ? "--r-pill" : `--r-${r.value.replace(/px$/, "").replace(".", "_")}`,
      r.value,
    ]),
    ...t.layout.tokens.map((l): Declaration => [
      l.name.startsWith("breakpoint-") ? `--bp-${without(l.name, "breakpoint-")}` : `--${l.name}`,
      l.value,
    ]),
  ];
  return { root, light: inTheme("light"), dark: inTheme("dark") };
}

// The variables as the stylesheet's first rules.
export function tokensCss(t: Tokens = TOKENS): string {
  const { root, light, dark } = tokenVariables(t);
  const block = (props: Declaration[], indent = "  "): string => props.map(([name, value]) => `${indent}${name}: ${value};`).join("\n");
  return [
    `:root {\n${block([...root, ...light])}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${block(dark, "    ")}\n  }\n}`,
    `:root[data-theme="dark"] {\n${block(dark)}\n}`,
    "",
  ].join("\n");
}
