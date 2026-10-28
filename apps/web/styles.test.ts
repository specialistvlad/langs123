// The stylesheets take their look from tokens.json alone: every colour is a colour token's variable, every shadow
// with a blur is a shadow token's, every padding, margin, gap and corner radius reads the spacing, radius or layout
// tokens, and every token variable they read is one tokens.ts sets. A ::backdrop's colour keeps a literal fallback, for
// browsers whose backdrop doesn't inherit the page's variables.
import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { tokenVariables } from "./tokens.ts";

const DIR = join(import.meta.dir, "styles");
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;
// A length other than zero, written out.
const LENGTH = /(?:^|[\s(,])-?(?:\d*\.)?\d+(?:px|em|rem|mm|pt)\b/g;
const SPACING = /^(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)?$/;
const RADIUS = /^border(?:-[a-z]+)*-radius$/;

interface Declaration {
  file: string;
  selector: string;
  property: string;
  value: string;
}

// Every declaration of every stylesheet, with the selector of its rule.
async function declarations(): Promise<Declaration[]> {
  const found: Declaration[] = [];
  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".css"))) {
    const css = (await Bun.file(join(DIR, file)).text()).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const rule of css.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
      const selector = (rule[1] ?? "").trim().replace(/\s+/g, " ");
      for (const d of (rule[2] ?? "").matchAll(/([a-z-]+|--[\w-]+)\s*:\s*([^;]+);/g)) {
        found.push({ file, selector, property: d[1] ?? "", value: (d[2] ?? "").trim().replace(/\s+/g, " ") });
      }
    }
  }
  return found;
}

const name = (d: Declaration): string => `${d.file} ${d.selector} { ${d.property}: ${d.value} }`;
// A value without the literal fallbacks of its variables.
const withoutFallbacks = (value: string): string => value.replace(/var\((--[\w-]+),[^()]*(?:\([^()]*\)[^()]*)*\)/g, "var($1)");

test("every colour is a colour token's variable", async () => {
  const literal = (await declarations()).filter((d) =>
    COLOUR.test(d.selector.endsWith("::backdrop") ? withoutFallbacks(d.value) : d.value),
  );
  expect(literal.map(name)).toEqual([]);
});

test("every shadow with a blur is a shadow token's variable", async () => {
  const blurred = (await declarations())
    .filter((d) => d.property === "box-shadow")
    .flatMap((d) => d.value.split(/,(?![^(]*\))/).map((item) => ({ ...d, value: item.trim() })))
    .filter((d) => !d.value.startsWith("var(--sh-") && /^(?:inset )?-?[\d.]+(?:px)? -?[\d.]+(?:px)? (?!0 )[\d.]+px/.test(d.value));
  expect(blurred.map(name)).toEqual([]);
});

test("every padding, margin, gap and corner radius reads a token, and so does each variable they read", async () => {
  const all = await declarations();
  const measured = all.filter((d) => SPACING.test(d.property) || RADIUS.test(d.property));
  const read = new Set(measured.flatMap((d) => [...d.value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])));
  const written = [...measured, ...all.filter((d) => read.has(d.property))].filter((d) =>
    [...d.value.matchAll(LENGTH)].some((m) => Number.parseFloat(m[0].replace(/^[\s(,]/, "")) !== 0),
  );
  expect(written.map(name)).toEqual([]);
});

test("every token variable the stylesheets read is one tokens.ts sets", async () => {
  const { root, light } = tokenVariables();
  const set = new Set([...root, ...light].map(([variable]) => variable));
  const read = (await declarations()).flatMap((d) =>
    [...d.value.matchAll(/var\((--(?:c|sh|t|f|s|r|bp)-[\w-]+)/g)].map((m) => ({ ...d, value: m[1] ?? "" })),
  );
  expect(read.filter((d) => !set.has(d.value)).map(name)).toEqual([]);
});
