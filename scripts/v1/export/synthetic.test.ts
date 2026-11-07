// Gate 4a check 9: the export of a library of v1's full size stays within its size budget.
import { expect, test } from "bun:test";
import { schemaProblems } from "../schema.ts";
import { BUDGET, exportSizes, PLAN, syntheticLibrary } from "./synthetic.ts";

// Building and exporting the full-size library takes about 4 s, and longer on a loaded machine.
test("every file of the full-size library's export stays within its budget", () => {
  const library = syntheticLibrary();
  expect(library.courses.map((c) => [c.course, c.topics.length])).toEqual(Object.entries(PLAN));
  expect(library.courses[0]?.topics[0]?.source.data.subtopics).toHaveLength(10);
  expect(library.courses[0]?.topics[0]?.languages).toHaveLength(11);
  expect(library.courses.map((c) => [c.course, c.index?.data.varieties ?? []])).toEqual([
    ["en", ["en-GB", "en-US"]],
    ["es", ["es-419", "es-ES"]],
    ["uk", []],
    ["fr", ["fr-FR", "fr-CA"]],
    ["ja", []],
    ["it", []],
    ["de", []],
  ]);
  for (const c of library.courses) expect([c.course, schemaProblems("index", c.index?.data, "index.yaml")]).toEqual([c.course, []]);
  for (const s of exportSizes(library)) {
    const budget = s.file === "library.json" ? BUDGET.library : BUDGET.course;
    expect([s.file, s.bytes <= budget.bytes, s.gzipped <= budget.gzipped]).toEqual([s.file, true, true]);
    expect(s.gzipped).toBeLessThan(s.bytes / 3);
  }
}, 30_000);
