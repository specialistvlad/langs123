// Previous, next and Up next on a topic page, in each grouping and at each level of the filter. A
// grouping lists its pages in order: by category the written topics, by level the steps of the study
// path. At a level, the filter shows the pages that start at or below it, and a page leads to the
// shown pages around it: nothing before the first, and from the last back to the first, Start over.
// Each distinct result renders once, tagged with the levels it serves (data-at); levels.css shows the
// one of the chosen level, and client.ts the one of the step being read.
import { topicTitle } from "../../scripts/content.ts";
import { plainText, reading, textIn } from "../../scripts/text.ts";
import { type Level, LEVELS, lv, type TopicRef } from "../../scripts/lib.ts";
import { refRange } from "../../scripts/levels.ts";
import type { Track } from "./context.ts";
import { stepLink } from "./path.ts";
import { topicUrl } from "./urls.ts";

export interface Entry {
  ref: TopicRef;
  // The link's attributes: its address, and on the study path the step it opens.
  link: string;
  title: string;
  level: Level;
  summary: string;
}

// Where a page leads at some levels of the filter.
export interface Around {
  at: Level[];
  prev: Entry | undefined;
  next: Entry | undefined;
  restart: boolean;
}

// One grouping's pages around the page at position i, at every level of the filter.
function around(list: Entry[], i: number): Around[] {
  const out = new Map<string, Around>();
  for (const level of LEVELS) {
    const shown = (e: Entry): boolean => lv(e.level) <= lv(level);
    const prev = list.slice(0, i).filter(shown).pop();
    const after = list.slice(i + 1).find(shown);
    const first = list.find(shown);
    const restart = after === undefined && first !== undefined && first !== list[i];
    const next = after ?? (restart ? first : undefined);
    const key = `${prev?.link ?? ""} ${next?.link ?? ""} ${String(restart)}`;
    const known = out.get(key);
    if (known) known.at.push(level);
    else out.set(key, { at: [level], prev, next, restart });
  }
  return [...out.values()];
}

// A grouping's rows for this page: by category one position, by level one per step of this topic.
export interface Placed {
  attrs: string;
  around: Around;
}

export function placed(track: Track, ref: TopicRef): Placed[] {
  const { lang, explain } = track;
  const summary = (r: TopicRef): string => (r.topic ? plainText(textIn(r.topic.summary.lead, explain), reading(explain, false)) : "");
  const byCategory: Entry[] = track.written.flatMap((r) => {
    const range = refRange(r, explain);
    return range
      ? [
          {
            ref: r,
            link: `href="${topicUrl(explain, lang, r)}"`,
            title: topicTitle(r, explain),
            level: range.from,
            summary: summary(r),
          },
        ]
      : [];
  });
  const byLevel: Entry[] = track.path
    .flatMap((stage) => stage.steps)
    .map((s) => ({
      ref: s.ref,
      link: stepLink(s.href, s.level),
      title: topicTitle(s.ref, explain),
      level: s.level,
      summary: summary(s.ref),
    }));
  const at = (a: Around): string => ` data-at="${a.at.join(" ")}"`;
  const index = byCategory.findIndex((e) => e.ref === ref);
  return [
    ...(index < 0 ? [] : around(byCategory, index).map((a) => ({ attrs: ` data-order="categories"${at(a)}`, around: a }))),
    ...byLevel.flatMap((e, i) =>
      e.ref === ref
        ? around(byLevel, i).map((a) => ({ attrs: ` data-order="path" data-step="${e.level}"${at(a)} hidden`, around: a }))
        : [],
    ),
  ];
}
