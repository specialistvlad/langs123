// The inputs a topic's source request takes from its course's index (12.2): the steps before the topic in the study
// path (FT-08), each earlier entry with its subject and what it covers, and the topic's own subject (IX-14), which names
// the whole set a reference table holds. A rule whose input the index lacks stays pending.
import type { CourseIndex } from "../generated/library-v1.ts";
import { LEVELS } from "../lib.ts";

type Entry = CourseIndex["sections"][number]["topics"][number];
type Step = Pick<Entry, "id" | "subject" | "covers">;

// The steps before a topic in the index's study path: the entries placed at a lower level, and those placed before
// it at its own first level; nothing where the index does not place the topic.
export function stepsBefore(index: CourseIndex | undefined, slug: string): Step[] | undefined {
  const entries = index?.sections.flatMap((s) => s.topics) ?? [];
  const own = entries.find((e) => e.id === slug);
  const first = LEVELS.find((l) => own?.path[l] !== undefined);
  if (own === undefined || first === undefined) return undefined;
  const rank = LEVELS.indexOf(first);
  const at = own.path[first] ?? 0;
  const before = (e: Entry): boolean =>
    LEVELS.some((l, n) => e.path[l] !== undefined && (n < rank || (n === rank && (e.path[l] ?? 0) < at)));
  return entries.filter((e) => e.id !== slug && before(e)).map((e) => ({ id: e.id, subject: e.subject, covers: e.covers }));
}

// The index's part of a topic's request, and the rules it gives their input.
export function topicInputs(index: CourseIndex | undefined, slug: string): { lines: string[]; given: Set<string> } {
  const given = new Set<string>();
  const lines: string[] = [];
  const steps = stepsBefore(index, slug);
  if (steps !== undefined) {
    given.add("FT-08");
    lines.push(
      `- FT-08, the steps before this topic ({list}), each with its subject and what it covers: ${steps.length === 0 ? "none, this is the first" : ""}`,
      ...steps.map((s) => `  - ${s.id}: ${s.subject}; ${s.covers.join(", ")}`),
    );
  }
  const entry = index?.sections.flatMap((s) => s.topics).find((e) => e.id === slug);
  if (entry !== undefined) {
    given.add("IX-14");
    lines.push(`- IX-14, the topic's subject ({subject}): ${entry.subject}`);
  }
  return { lines: lines.length === 0 ? [] : ["", "## From the index", ...lines], given };
}
