// A topic's guide as HTML pieces: its summary as section 00, then its sections.
import { plainText, reading, textIn } from "../../scripts/text.ts";
import { type Block, type Explain, type Level, say, type Text, type Topic } from "../../scripts/lib.ts";
import { contentLevels, contentRange, type Range, sectionRange } from "../../scripts/levels.ts";
import { type Ctx, escapeHtml, inline } from "./html.ts";
import { varietyLevelAttrs } from "./parts.ts";
import { blocksHtml } from "./render.ts";

export type SectionKind = "summary" | "body";

// A guide section ready to wrap in a <section>, with the range of its leaves: its title as plain
// text for anchors and the rail, and as HTML for its heading.
export interface GuideSection {
  title: string;
  heading: string;
  range: Range;
  // The levels its leaves hold, lowest first.
  levels: Level[];
  // Where a variety's leaves start above the range: data-level-{variety} attributes.
  varietyLevels: string;
  kind: SectionKind;
  html: string;
}

// A guide part before rendering: its title, the range of its leaves and its blocks.
export interface GuidePart {
  title: string;
  heading: Text | null;
  range: Range;
  levels: Level[];
  kind: SectionKind;
  content: Block[];
}

// The summary (the topic's cheatsheet) and the sections that have content for this reader, in page order.
export function guideParts(topic: Topic, explain: Explain): GuidePart[] {
  const out: GuidePart[] = [];
  const sheet = contentRange(topic.cheatsheet.content, explain);
  if (sheet) {
    out.push({
      title: say("summary", explain),
      heading: null,
      range: sheet,
      levels: contentLevels(topic.cheatsheet.content, explain),
      kind: "summary",
      content: topic.cheatsheet.content,
    });
  }
  for (const section of topic.sections) {
    // A section without content for this reader is skipped before its title is read.
    const range = sectionRange(section, explain);
    if (range !== null) {
      const heading = textIn(section.title, explain);
      out.push({
        title: plainText(heading, reading(explain, false)),
        heading,
        range,
        levels: contentLevels(section.content, explain),
        kind: "body",
        content: section.content,
      });
    }
  }
  return out;
}

// The guide parts rendered for a reader.
export function guideSections(ctx: Ctx): GuideSection[] {
  const topic = ctx.ref.topic;
  if (!topic) return [];
  return guideParts(topic, ctx.explain).map((p) => ({
    title: p.title,
    heading: p.heading === null ? escapeHtml(p.title) : inline(p.heading, ctx, false),
    range: p.range,
    levels: p.levels,
    varietyLevels: varietyLevelAttrs(p.content, ctx.explain, ctx.varieties, p.range.from),
    kind: p.kind,
    html: blocksHtml(p.content, ctx, p.range.from),
  }));
}
