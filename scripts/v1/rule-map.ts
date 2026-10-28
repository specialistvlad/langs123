// Gate 4a check 2: every rule of library/RULES.md that a program checks, by the schema or the linter, has the check
// that holds it and a test that names it. The checks are the schema's annotations (x-rule, x-extra), the mark
// grammar's attributes, the layout, the marks, the alignment, the linter's rules and the catalog's own check; a
// test names a rule by its id in a test file under scripts/.
import { join, relative } from "node:path";
import { ROOT } from "../lib.ts";
import type { Catalog } from "../rule-catalog.ts";
import { ALIGNMENT_RULES } from "./alignment.ts";
import { lintRules } from "./lint/rules.ts";
import { MARK_RULES } from "./marks-check.ts";
import { MARKS } from "./marks.ts";
import { SCHEMA } from "./schema.ts";
import { STRUCTURE_RULES } from "./structure.ts";

// The catalog's own rules, which its check holds (scripts/rule-catalog.ts, bun run rules).
const CATALOG_RULES = ["CA-01", "CA-03", "CA-04", "CA-05"];
// The rule the schema holds by what it leaves out: a subtopic's schema registers no role.
const SCHEMA_SHAPE = ["ST-09"];
const ID = /\b[A-Z]{2}-\d{2}\b/g;

// Every rule id an annotation of the schema names, at any depth.
function annotated(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(annotated);
  if (typeof node !== "object" || node === null) return [];
  const own = Object.entries(node).flatMap(([key, value]) =>
    key === "x-rule" && typeof value === "string" ? [value] : key === "x-extra" ? Object.values(value as Record<string, string>) : [],
  );
  return [...own, ...Object.values(node).flatMap(annotated)];
}

// Each rule id a check holds, with the checks that hold it.
export function implemented(): Map<string, string[]> {
  const checks: [string, string[]][] = [
    ["the schema", [...annotated(SCHEMA), ...SCHEMA_SHAPE]],
    ["the mark grammar", Object.values(MARKS).flatMap((m) => (m.attribute === undefined ? [] : [m.attribute.rule]))],
    ["the layout", STRUCTURE_RULES],
    ["the marks", MARK_RULES],
    ["the alignment", ALIGNMENT_RULES],
    ["the linter", lintRules().map((r) => r.id)],
    ["the catalog's check", CATALOG_RULES],
  ];
  const map = new Map<string, string[]>();
  for (const [check, ids] of checks) for (const id of ids) map.set(id, [...new Set([...(map.get(id) ?? []), check])]);
  return map;
}

// Each rule id the test files under scripts/ name, with the files that name it.
export async function tested(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  for await (const path of new Bun.Glob("scripts/**/*.test.ts").scan({ cwd: ROOT })) {
    const text = await Bun.file(join(ROOT, path)).text();
    for (const id of new Set(text.match(ID) ?? [])) map.set(id, [...(map.get(id) ?? []), relative("scripts", path)]);
  }
  return map;
}

// The rules a program checks that lack their check or their test.
export async function unmapped(catalog: Catalog): Promise<{ id: string; lacks: string }[]> {
  const checks = implemented();
  const tests = await tested();
  return catalog.rules
    .filter((r) => r.fields.check === "schema" || r.fields.check === "lint")
    .flatMap((r) => [
      ...(checks.has(r.id) ? [] : [{ id: r.id, lacks: "a check" }]),
      ...(tests.has(r.id) ? [] : [{ id: r.id, lacks: "a test" }]),
    ]);
}
