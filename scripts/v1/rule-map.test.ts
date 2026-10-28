// Gate 4a check 2: every rule a program checks has its check and a test; and the catalog's own rules (CA-01,
// CA-03, CA-04, CA-05) hold over library/RULES.md and fail their written cases.
import { expect, test } from "bun:test";
import { readRules, ruleProblems, RULES_FILE, unstated } from "../rule-catalog.ts";
import { implemented, tested, unmapped } from "./rule-map.ts";

const catalog = await readRules(RULES_FILE);

test("every schema and lint rule of the catalog has the check that holds it and a test that names it", async () => {
  expect(await unmapped(catalog)).toEqual([]);
  expect(implemented().get("ER-06")).toEqual(["the schema"]);
  expect(implemented().get("LA-01")).toEqual(["the layout", "the alignment"]);
  expect((await tested()).get("SH-01")).toContain("v1/lint/shape.test.ts");
});

test("a rule with no check and no test is named", async () => {
  // The id is put together here, so that no test file names it.
  const id = ["ZZ", "99"].join("-");
  const planted = { ...catalog, rules: [...catalog.rules, { id, name: "x", line: 0, fields: { check: "lint" }, read: [] }] };
  expect((await unmapped(planted)).filter((u) => u.id === id)).toEqual([
    { id, lacks: "a check" },
    { id, lacks: "a test" },
  ]);
});

test("CA-01, CA-03, CA-04 and CA-05: the catalog's own rules hold, and each written case fails", async () => {
  const conventions = await Bun.file(RULES_FILE.replace("RULES.md", "CONVENTIONS.md")).text();
  expect(ruleProblems(catalog)).toEqual([]);
  expect(unstated(catalog, conventions)).toEqual([]);
  const [first] = catalog.rules;
  if (first === undefined) throw new Error("the catalog holds no rule");
  const broken = (fields: Partial<typeof first.fields>): string[] =>
    ruleProblems({ ...catalog, rules: [{ ...first, fields: { ...first.fields, ...fields } }] });
  expect(unstated(catalog, conventions.replaceAll("CA-01", "CA-0x"))).toHaveLength(1);
  expect(broken({ notThis: "a sentence with no quote and no file" }).length).toBeGreaterThan(0);
  expect(broken({ check: "review" }).length).toBeGreaterThan(0);
  expect(broken({ courses: "en, klingon" }).length).toBeGreaterThan(0);
});
