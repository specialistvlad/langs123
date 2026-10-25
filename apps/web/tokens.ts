// The look of the site and of every app the library feeds: tokens.json, the design system's tokens, the one source of
// its colours and shadows. A token named like a variable of the stylesheets sets it: a site colour (bg, accent,
// warn…) --<name>; level-<x>-<tone> --lvl-<X>-<tone>, which levels.css hands to a level's elements and the export
// writes into the library; level-mark-<part> the level mark's --lvm-<part>; shadow-card --shadow. The light values
// sit on :root, the dark ones under the two selectors of a reader's choice and the system's.
import file from "./tokens.json";

export interface Token {
  name: string;
  value: string | Record<string, string>;
}
interface Tokens {
  color: { themes: { id: string }[]; tokens: Token[] };
  shadow: { tokens: Token[] };
}
const TOKENS = file as Tokens;
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

// The stylesheets' colour variables a token sets by its own name.
const SITE_COLOURS = new Set([
  "bg",
  "surface",
  "surface-2",
  "text",
  "muted",
  "border",
  "accent",
  "accent-soft",
  "good",
  "good-soft",
  "bad",
  "bad-soft",
  "warn",
  "warn-soft",
]);

// A token's variable, or undefined for one the stylesheets do not read (the design system's own).
export function variable(name: string): string | undefined {
  const level = /^level-([a-z]\d)-(ink|tint|strong)$/.exec(name);
  if (level) return `--lvl-${(level[1] ?? "").toUpperCase()}-${level[2] ?? ""}`;
  const mark = /^level-mark-(fill|off|text)$/.exec(name);
  if (mark) return `--lvm-${mark[1] ?? ""}`;
  if (SITE_COLOURS.has(name)) return `--${name}`;
  if (name === "shadow-card") return "--shadow";
  return undefined;
}

const valueIn = (t: Token, theme: Theme): string | undefined => (typeof t.value === "string" ? t.value : t.value[theme]);

// A token's value in a theme; every token the site reads has one in each.
export function token(name: string, theme: Theme, tokens: Token[] = TOKENS.color.tokens): string {
  const value = tokens.find((t) => t.name === name);
  const found = value === undefined ? undefined : valueIn(value, theme);
  if (found === undefined) throw new Error(`tokens.json has no ${theme} value for ${name}`);
  return found;
}

// The variables of the tokens in each theme: light on :root, dark under the reader's choice and the system's.
export function tokensCss(tokens: Token[] = [...TOKENS.color.tokens, ...TOKENS.shadow.tokens]): string {
  const block = (theme: Theme): string =>
    tokens
      .flatMap((t) => {
        const name = variable(t.name);
        const value = valueIn(t, theme);
        return name === undefined || value === undefined ? [] : [`  ${name}: ${value};`];
      })
      .join("\n");
  const dark = block("dark");
  return [
    `:root {\n${block("light")}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${dark.replace(/^/gm, "  ")}\n  }\n}`,
    `:root[data-theme="dark"] {\n${dark}\n}`,
    "",
  ].join("\n");
}
