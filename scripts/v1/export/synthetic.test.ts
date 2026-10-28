// Gate 4a check 9: the export of a library of v1's full size stays within its size budget.
import { expect, test } from "bun:test";
import { BUDGET, exportSizes, PLAN, syntheticLibrary } from "./synthetic.ts";

test("every file of the full-size library's export stays within its budget", () => {
  const library = syntheticLibrary();
  expect(library.courses.map((c) => [c.course, c.topics.length])).toEqual(Object.entries(PLAN));
  expect(library.courses[0]?.topics[0]?.source.data.subtopics).toHaveLength(10);
  expect(library.courses[0]?.topics[0]?.languages).toHaveLength(11);
  for (const s of exportSizes(library)) {
    const budget = s.file === "library.json" ? BUDGET.library : BUDGET.course;
    expect([s.file, s.bytes <= budget.bytes, s.gzipped <= budget.gzipped]).toEqual([s.file, true, true]);
    expect(s.gzipped).toBeLessThan(s.bytes / 3);
  }
});
