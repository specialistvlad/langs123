// The flagged queue the review preview reads (RV-09, RV-10): each topic whose review flagged rules, with its wave and
// the owner's readings it still needs; and in each wave, the topics a one-in-ten draw of the unflagged ones takes,
// seeded by the wave's approval so the draw can be made again.
import { createHash } from "node:crypto";
import { LEVELS } from "../lib.ts";
import type { Library, Topic } from "../v1/library.ts";

export interface QueueEntry {
  topic: string;
  // The wave the topic is written in: its lowest level.
  wave: string;
  why: "flagged" | "sampled";
  flagged: string[];
  // The languages the owner still reads it in.
  reads: string[];
}

const waveOf = (t: Topic): string => LEVELS.find((l) => t.source.data.subtopics.some((s) => s.level === l)) ?? "A0";
const order = (seed: number, id: string): string =>
  createHash("sha256")
    .update(`${String(seed)} ${id}`)
    .digest("hex");

export function queueOf(library: Library): QueueEntry[] {
  const reviewed = library.courses.flatMap((c) => c.topics).filter((t) => t.review !== undefined);
  const entry = (t: Topic, why: QueueEntry["why"]): QueueEntry => ({
    topic: t.source.data.id,
    wave: waveOf(t),
    why,
    flagged: t.review?.data.flagged ?? [],
    reads: ["uk", "en"].filter((l) => !(t.review?.data.owner ?? []).some((o) => o.language === l)),
  });
  const flagged = reviewed.filter((t) => (t.review?.data.flagged ?? []).length > 0).map((t) => entry(t, "flagged"));
  const sampled = LEVELS.flatMap((wave) => {
    const clean = reviewed.filter((t) => waveOf(t) === wave && (t.review?.data.flagged ?? []).length === 0);
    const seed = library.approvals?.data.find((a) => a.what === `wave:${wave}`)?.seed ?? 0;
    const drawn = [...clean].sort((a, b) => order(seed, a.source.data.id).localeCompare(order(seed, b.source.data.id)));
    return drawn.slice(0, Math.ceil(clean.length / 10)).map((t) => entry(t, "sampled"));
  });
  return [...flagged, ...sampled];
}
