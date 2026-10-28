// The mark grammar: marks nest, take their attribute first, escape a brace, and every break of the grammar and every
// attribute out of its form is named with its rule; every mark records why it exists (ST-05).
import { describe, expect, test } from "bun:test";
import { MARKS, marksOf, parseMarks, plain, swapsOf } from "./marks.ts";

describe("parseMarks", () => {
  test("reads plain text, a mark, a mark with its attribute and nested marks", () => {
    expect(parseMarks("plain")).toEqual({ runs: ["plain"], problems: [] });
    expect(parseMarks("She {target works}.").runs).toEqual(["She ", { name: "target", content: ["works"] }, "."]);
    expect(parseMarks("{target {variant en-GB opposite} {variant en-US across from}}").runs).toEqual([
      {
        name: "target",
        content: [
          { name: "variant", attribute: "en-GB", content: ["opposite"] },
          " ",
          { name: "variant", attribute: "en-US", content: ["across from"] },
        ],
      },
    ]);
    expect(parseMarks("{kanji た 食}べる").runs).toEqual([{ name: "kanji", attribute: "た", content: ["食"] }, "べる"]);
  });

  test("writes a brace or a backslash after a backslash", () => {
    expect(parseMarks("a \\{b\\} \\\\ c \\x").runs).toEqual(["a {b} \\ c \\x"]);
  });

  test("names each break of the grammar with ST-06", () => {
    const rules = (text: string): string[] => parseMarks(text).problems.map((p) => `${p.rule} ${p.message}`);
    expect(rules("a } b")).toEqual(["ST-06 a } at 2 closes no mark"]);
    expect(rules("{target open")).toEqual(["ST-06 a mark is never closed with }"]);
    expect(rules("{bold x}")).toEqual(["ST-06 {bold} is no mark of the vocabulary"]);
    expect(rules("{target}")).toEqual(["ST-06 {target} marks no text"]);
    expect(parseMarks("{bold x}").runs).toEqual(["x"]);
  });

  test("names an attribute out of its form with the mark's rule", () => {
    const rule = (text: string): string | undefined => parseMarks(text).problems[0]?.rule;
    expect(rule("{variant British x}")).toBe("NO-28");
    expect(rule("{kanji ta 食}")).toBe("NO-24");
    expect(rule("{date 2026-13-01 x}")).toBe("ST-08");
    expect(rule("{weekday 8 x}")).toBe("ST-08");
    expect(rule("{time 25:00 x}")).toBe("ST-08");
    expect(rule("{numeral two x}")).toBe("ST-08");
    expect(rule("{ordinal 3rd x}")).toBe("ST-08");
    expect(rule("{l1 French x}")).toBe("ST-06");
    expect(
      parseMarks("{date 2026-07-03 3 July} {weekday 1 Monday} {time 09:30 half past nine} {numeral 200 two hundred} {ordinal 3 third}")
        .problems,
    ).toEqual([]);
  });
});

test("every mark records why it exists and the text it stands in (ST-05)", () => {
  for (const info of Object.values(MARKS)) {
    expect(info.why).toMatch(/^(seen|read)/);
    expect(["course", "explanation", "any"]).toContain(info.where);
  }
});

test("plain gives the text a reader sees", () => {
  expect(plain(parseMarks("The ball is {target {variant en-GB opposite} {variant en-US across from}} the box.").runs)).toBe(
    "The ball is opposite across from the box.",
  );
});

test("marksOf lists every mark with the marks it stands inside", () => {
  const found = marksOf(parseMarks("{ipa {variant en-GB wɜːks}} {term x}").runs);
  expect(found.map((f) => [f.mark.name, f.inside.map((m) => m.name)])).toEqual([
    ["ipa", []],
    ["variant", ["ipa"]],
    ["term", []],
  ]);
});

test("swapsOf finds each run of variants joined by one space, at any depth", () => {
  const swaps = (text: string): string[][] => swapsOf(parseMarks(text).runs).map((s) => s.map((m) => m.attribute ?? ""));
  expect(swaps("{variant en-GB zed} {variant en-US ziː}")).toEqual([["en-GB", "en-US"]]);
  expect(swaps("a {variant en-US x} b")).toEqual([["en-US"]]);
  expect(swaps("{variant en-GB a}, {variant en-US b}")).toEqual([["en-GB"], ["en-US"]]);
  expect(swaps("{variant en-GB a} {target b}")).toEqual([["en-GB"]]);
  expect(swaps("{variant en-GB a} ")).toEqual([["en-GB"]]);
  expect(swaps("{target {variant en-GB a} {variant en-US b}}")).toEqual([["en-GB", "en-US"]]);
});
