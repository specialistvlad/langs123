// The review preview's entries (pages/review.ts), from a checked root of the new library: each topic with its status, its
// writer, its reviews by model with their runs, its flagged rules, the check's problems in its folder and every finding
// of its record; and its place in the flagged queue (scripts/review/queue.ts), with the languages the owner still reads.
import type { QueueEntry } from "../../scripts/review/queue.ts";
import { LEVELS } from "../../scripts/lib.ts";
import type { Library, Topic } from "../../scripts/v1/library.ts";
import type { Problem } from "../../scripts/v1/schema.ts";
import type { ReviewEntry } from "./review.ts";

// A topic's wave: the lowest level of its subtopics.
const waveOf = (t: Topic): string => LEVELS.find((l) => t.source.data.subtopics.some((s) => s.level === l)) ?? "A0";

export function reviewEntries(library: Library, problems: readonly Problem[], queue: readonly QueueEntry[]): ReviewEntry[] {
  return library.courses.flatMap((course) =>
    course.topics.map((t): ReviewEntry => {
      const record = t.review?.data;
      const queued = queue.find((q) => q.topic === t.source.data.id);
      const runs = new Map<string, number>();
      for (const r of record?.reviews ?? []) runs.set(r.model, (runs.get(r.model) ?? 0) + 1);
      return {
        topic: t.source.data.id,
        course: t.course,
        slug: t.slug,
        wave: waveOf(t),
        status: record?.statuses.at(-1)?.status ?? t.source.data.status,
        writer: record?.writer ?? { session: "", model: "" },
        reviews: [...runs].map(([model, n]) => ({ model, runs: n })),
        flagged: record?.flagged ?? [],
        reads: queued?.reads ?? [],
        ...(queued !== undefined && { why: queued.why }),
        problems: problems
          .filter((p) => p.file.includes(`/${t.course}/${t.slug}/`))
          .map((p) => ({ ...(p.rule !== undefined && { rule: p.rule }), ...(p.id !== undefined && { id: p.id }), message: p.message })),
        findings: (record?.reviews ?? []).flatMap((r) => r.findings.map((f) => ({ ...f, model: r.model, run: r.run }))),
      };
    }),
  );
}
