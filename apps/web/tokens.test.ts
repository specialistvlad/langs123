// The tokens: each one the stylesheets read sets its variable in the light theme and the dark one, a token of the
// design system's own sets none, and a value missing in a theme is named.
import { expect, test } from "bun:test";
import { token, tokensCss, variable } from "./tokens.ts";

test("tokens become the stylesheets' variables in each theme", () => {
  const css = tokensCss([
    { name: "accent", value: { light: "#2f5bd3", dark: "#7ea2ff" } },
    { name: "level-a1-tint", value: { light: "#fff", dark: "#000" } },
    { name: "level-mark-text", value: { light: "#5c5c62", dark: "#9a9aa2" } },
    { name: "shadow-card", value: "none" },
    { name: "spacing-4", value: "16px" },
  ]);
  expect(css).toContain(":root {\n  --accent: #2f5bd3;\n  --lvl-A1-tint: #fff;\n  --lvm-text: #5c5c62;\n  --shadow: none;\n}");
  expect(css).toContain(
    ':root[data-theme="dark"] {\n  --accent: #7ea2ff;\n  --lvl-A1-tint: #000;\n  --lvm-text: #9a9aa2;\n  --shadow: none;\n}',
  );
  expect(css).toContain(':root:not([data-theme="light"]) {\n    --accent: #7ea2ff;');
  expect(css).not.toContain("spacing");
  expect(variable("level-c2-strong")).toBe("--lvl-C2-strong");
});

test("every colour the site reads has a value in each theme, and a missing one is named", () => {
  expect(token("bg", "light")).toMatch(/^#/);
  expect(token("level-a0-strong", "dark")).toMatch(/^#/);
  expect(() => token("no-such-token", "light")).toThrow("tokens.json has no light value for no-such-token");
  expect(() => token("accent", "dark", [{ name: "accent", value: { light: "#000" } }])).toThrow("no dark value for accent");
});
