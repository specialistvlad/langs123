// The parts of a topic page in the frame (pages/topic.ts): the parts' lists, numbered from the summary's 00, Up next and
// the study path, a line per level the topic is a step of.
import { topicTitle } from "../../scripts/content.ts";
import { levelName, say, type TopicRef } from "../../scripts/lib.ts";

import type { Track } from "./context.ts";
import { glyph } from "./glyphs.ts";
import type { GuideSection } from "./guide.ts";
import { escapeHtml } from "./html.ts";
import { bars } from "./level-mark.ts";
import { levelAttrs, refLevels, single } from "./parts.ts";
import { stepLink } from "./path.ts";
import { placed } from "./sequence.ts";

const sym = (body: string, size = 22, width = 1.9): string => glyph(body, size, width);
const PREV = sym('<path d="M15 4.5L7.5 12l7.5 7.5"/>', 16);
const NEXT = sym('<path d="M9 4.5l7.5 7.5L9 19.5"/>', 16);
export const CHEVRON =
  '<svg class="tp-chev" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5"/></svg>';
export const CLOCK =
  '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5.6" stroke="currentColor" stroke-width="1.4"/><path d="M7 4v3.2l2 1.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

export const num = (n: number): string => String(n).padStart(2, "0");

// The topic's parts, numbered from the summary's 00, as a phone's contents page lists them (a row each with a chevron)
// and as the outline at the top right of a wide reading lists them (Contents, number and title, the first marked until
// the reader scrolls: client-topic.ts follows the scroll). Neither carries level marks.
export function parts(sections: GuideSection[], ids: string[]): { rows: string; outline: string } {
  let n = 0;
  const numbered = sections.map((s, i) => ({ s, label: num(s.kind === "summary" ? 0 : ++n), href: `#${ids[i] ?? ""}` }));
  const rows = numbered
    .map(
      ({ s, label, href }, i) =>
        `<li><a href="${href}"${i === 0 ? ' class="on"' : ""}><span class="tp-n">${label}</span><span class="name">${s.heading}</span>${CHEVRON}</a></li>`,
    )
    .join("");
  const outline = numbered
    .map(
      ({ s, label, href }, i) =>
        `<a href="${href}"${i === 0 ? ' class="on" aria-current="location"' : ""}><b>${label}</b><span>${s.heading}</span></a>`,
    )
    .join("");
  return { rows, outline };
}

// Up next: the next page, or the first to start over, with its range and first sentence.
export const upNext = (track: Track, ref: TopicRef): string =>
  placed(track, ref)
    .flatMap(({ attrs, around: a }) => {
      const e = a.next;
      if (e === undefined) return [];
      const levels = e.link.includes("data-path-step") ? [e.level] : refLevels(e.ref, track.explain);
      return [
        `<div class="up-next"${attrs}><p class="tp-caps">${escapeHtml(a.restart ? track.t.startOver : track.t.upNext)}</p><a class="next" ${e.link}><strong>${escapeHtml(e.title)}</strong>${bars(levels.length > 0 ? levels : [e.level], track.explain)}${CHEVRON}<span class="summary">${escapeHtml(e.summary)}</span></a></div>`,
      ];
    })
    .join("");

// The study path: a line per level the topic is a step of, the level's mark, its name and the topic's step among its
// steps, then the steps before and after it, each a link that opens at the step's level.
export function studyPath(track: Track, ref: TopicRef): string {
  const { explain, t } = track;
  const rows = track.path.flatMap((stage) => {
    const at = stage.steps.findIndex((s) => s.ref === ref);
    if (at < 0) return [];
    const link = (i: number, arrow: string, before: boolean): string => {
      const step = stage.steps[i];
      if (step === undefined) return "";
      const title = escapeHtml(topicTitle(step.ref, explain));
      return `<a${before ? "" : ' class="tp-nx"'} ${stepLink(step.href, step.level)}>${before ? `${arrow}${title}` : `${title}${arrow}`}</a>`;
    };
    const where = say("pathStep", explain, { n: String(at + 1), total: String(stage.steps.length) });
    const words = escapeHtml(`${stage.level} ${levelName(stage.level, explain)} · ${where}`);
    return [
      `<div class="tp-path-row"${levelAttrs(single(stage.level))}><p class="tp-path-h">${bars([stage.level], explain, { small: true })}<span>${words}</span></p><p class="tp-path-n">${link(at - 1, PREV, true)}${link(at + 1, NEXT, false)}</p></div>`,
    ];
  });
  return rows.length === 0
    ? ""
    : `<div class="tp-study"><p class="tp-caps">${escapeHtml(t.studyPath)}</p><div class="tp-card">${rows.join("")}</div></div>`;
}
