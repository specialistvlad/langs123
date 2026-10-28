// The tokens: every token sets its variable, named by its group; the colours and the shadows whose themes differ take
// their light values on :root and their dark ones under the reader's choice and the system's; a value missing in a
// theme is named. Every design sets the same variables, and a command line names its design with --design.
import { expect, test } from "bun:test";
import { DEFAULT_DESIGN, DESIGNS, designArg, designTokens, type Tokens, token, tokensCss, tokenVariables } from "./tokens.ts";

const SAMPLE: Tokens = {
  color: {
    tokens: [
      { name: "accent", value: { light: "#2f5bd3", dark: "#7ea2ff" } },
      { name: "level-a1-tint", value: { light: "#fff", dark: "#000" } },
    ],
  },
  shadow: {
    tokens: [
      { name: "shadow-card", value: { light: "0 1px 2px rgba(0, 0, 0, 0.04)", dark: "none" } },
      { name: "shadow-panel", value: "0 12px 32px rgba(0, 0, 0, 0.14)" },
      { name: "shadow-segment", value: { light: "0 1px 2px  black", dark: "0 1px 2px black" } },
    ],
  },
  type: {
    families: { sans: "-apple-system,\n  sans-serif" },
    groups: [
      {
        styles: [
          { name: "body", fontSize: "15px", lineHeight: 1.55, fontWeight: 400 },
          { name: "label", fontSize: "11px", letterSpacing: "0.06em" },
        ],
      },
    ],
  },
  spacing: { tokens: [{ name: "space-16", value: "16px" }] },
  radius: {
    tokens: [
      { name: "radius-xl", value: "12px" },
      { name: "radius-pill", value: "999px" },
    ],
  },
  layout: {
    tokens: [
      { name: "breakpoint-phone", value: "860px" },
      { name: "measure", value: "70ch" },
    ],
  },
};

test("every token sets its variable, named by its group", () => {
  const { root, light, dark } = tokenVariables(SAMPLE);
  expect(Object.fromEntries(root)).toEqual({
    "--sh-panel": "0 12px 32px rgba(0, 0, 0, 0.14)",
    "--sh-segment": "0 1px 2px black",
    "--t-body-size": "15px",
    "--t-body-lh": "1.55",
    "--t-body-weight": "400",
    "--t-body-track": "0",
    "--t-label-size": "11px",
    "--t-label-lh": "normal",
    "--t-label-weight": "400",
    "--t-label-track": "0.06em",
    "--f-sans": "-apple-system, sans-serif",
    "--s-16": "16px",
    "--r-12": "12px",
    "--r-pill": "999px",
    "--bp-phone": "860px",
    "--measure": "70ch",
  });
  expect(light).toEqual([
    ["--c-accent", "#2f5bd3"],
    ["--c-level-a1-tint", "#fff"],
    ["--sh-card", "0 1px 2px rgba(0, 0, 0, 0.04)"],
  ]);
  expect(dark).toEqual([
    ["--c-accent", "#7ea2ff"],
    ["--c-level-a1-tint", "#000"],
    ["--sh-card", "none"],
  ]);
});

test("the light values stand on :root, the dark ones under the reader's choice and the system's", () => {
  const css = tokensCss(SAMPLE);
  expect(css).toContain(":root {\n  --sh-panel: 0 12px 32px rgba(0, 0, 0, 0.14);");
  expect(css).toContain("  --c-accent: #2f5bd3;\n  --c-level-a1-tint: #fff;\n  --sh-card: 0 1px 2px rgba(0, 0, 0, 0.04);\n}");
  expect(css).toContain('@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    --c-accent: #7ea2ff;');
  expect(css).toContain(':root[data-theme="dark"] {\n  --c-accent: #7ea2ff;\n  --c-level-a1-tint: #000;\n  --sh-card: none;\n}');
});

test("the site's own tokens set every variable its stylesheets read from them", () => {
  const css = tokensCss();
  for (const name of [
    "--c-bg",
    "--c-level-c2-strong",
    "--c-level-mark-fill",
    "--sh-card",
    "--f-sans-uk",
    "--f-mono",
    "--t-reading-body-size",
    "--s-4",
    "--r-pill",
    "--measure",
  ]) {
    expect(css).toContain(`  ${name}: `);
  }
});

test("every colour has a value in each theme, and a missing one is named", () => {
  expect(token("bg", "light")).toMatch(/^#/);
  expect(token("level-a0-strong", "dark")).toMatch(/^#/);
  expect(() => token("no-such-token", "light")).toThrow("tokens.json has no light value for no-such-token");
  expect(() => token("accent", "dark", [{ name: "accent", value: { light: "#000" } }])).toThrow("no dark value for accent");
});

test("the designs are tokens.json, the default, and each tokens.<name>.json beside it", () => {
  expect(DESIGNS).toEqual([DEFAULT_DESIGN, "proof"]);
  expect(designTokens()).toBe(designTokens(DEFAULT_DESIGN));
  expect(designTokens("proof")).toBe(designTokens("proof"));
  expect(token("accent", "light", designTokens("proof").color.tokens)).not.toBe(token("accent", "light"));
  expect(() => designTokens("nope")).toThrow("no design nope; the designs are default, proof");
});

test("every design sets the variables the default design sets, in the same order", () => {
  const names = (design: string): string[][] =>
    Object.values(tokenVariables(designTokens(design))).map((declarations) => declarations.map(([name]) => name));
  for (const design of DESIGNS) expect(names(design)).toEqual(names(DEFAULT_DESIGN));
});

test("a radius token keeps the variable its px gives it in the default design, whatever its value", () => {
  const { root } = tokenVariables({
    ...SAMPLE,
    radius: {
      tokens: [
        { name: "radius-xl", value: "4px" },
        { name: "radius-new", value: "9px" },
      ],
    },
  });
  expect(root).toContainEqual(["--r-12", "4px"]);
  expect(root).toContainEqual(["--r-9", "9px"]);
});

test("a command line names its design with --design, and the default design without it", () => {
  expect(designArg(["--full"])).toBe(DEFAULT_DESIGN);
  expect(designArg(["en.verbs.would", "--design", "proof"])).toBe("proof");
  expect(() => designArg(["--design", "nope"])).toThrow("no design nope");
  expect(() => designArg(["--design"])).toThrow("--design takes a design's name: default, proof");
});
