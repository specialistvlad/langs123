// Each block's text as the reading shows it, for a program that reads the same export to hold its own text to the web's
// (M5's gate check 6): per topic written in the language, each block of its subtopics and each of the language's own blocks
// by id, in the course's first variety and at a column where every table stands whole, its words alone: the labels and the
// varieties' capsules left out, the marks as their text, the spaces one.
import type { LibraryV1 } from "../../scripts/export.ts";
import { Reading } from "./reading.ts";
import { block, ownBlock } from "./reading-blocks.ts";
import { Words } from "./reading-words.ts";

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"' };

// The words of some HTML: its labels and capsules out, a space where a line, a cell or a translation ends, its other tags
// gone, its entities decoded, its spaces one.
export const words = (html: string): string =>
  html
    .replace(/<(p|span) class="(lx-label|lx-capsule)">[^<]*<\/\1>/g, "")
    .replace(/<(br|\/p|\/li|\/td|\/th|\/tr|div|\/div)\b[^>]*>|<span class="(lx-tr|rd-trl|rd-lang|lx-j)"[^>]*>/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, " ")
    .trim();

export function readingTexts(v1: LibraryV1, language: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const say = Words.of(v1.library, language);
  for (const file of v1.courses) {
    const course = v1.library.courses.find((c) => c.code === file.course);
    for (const topic of file.topics.filter((t) => language in t.title.text)) {
      const r = new Reading(topic, course?.source ?? file.course, [language], say, 100_000, course?.varieties[0]?.code ?? "all");
      const texts: Record<string, string> = {};
      for (const b of topic.subtopics.flatMap((s) => s.blocks).filter((x) => r.shows(x.variety))) texts[b.id] = words(block(r, b));
      for (const o of (topic.own[language]?.blocks ?? []).filter((x) => r.shows(x.variety))) texts[o.id] = words(ownBlock(r, language, o));
      out[topic.id] = texts;
    }
  }
  return out;
}
