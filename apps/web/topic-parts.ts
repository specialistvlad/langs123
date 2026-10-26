// A topic's parts as the course index shows them in its right pane (pages/track.ts opens a topic there): the topic's
// title with its level mark and reading time, its lead, "Contents" with the numbered parts, each with its level mark
// and a chevron, then Up next. The topic page carries this fragment, hidden, as data-sp-fragment (topic-parts.css
// shows it inside the split view's right pane alone); its parts' links are the topic's own addresses, and the level
// marks keep the keys of the topic page's level data.
import { topicTitle } from "../../scripts/content.ts";
import type { TopicRef } from "../../scripts/lib.ts";
import type { Track } from "./context.ts";
import type { GuideSection } from "./guide.ts";
import { escapeHtml } from "./html.ts";
import { bars, levelsLabel, markButton } from "./level-mark.ts";
import { num } from "./lesson-chrome.ts";
import { refLevels } from "./parts.ts";
import { placed } from "./sequence.ts";
import { CHEVRON } from "./track-parts.ts";
import { topicUrl } from "./urls.ts";

export interface TopicParts {
  // The topic's sections (the summary first) and the anchor id of each.
  all: GuideSection[];
  ids: string[];
  // The topic's level mark and reading time, and its lead (the summary's first sentence) as the topic page renders them.
  props: string;
  lead: string;
}

// A part: its number, name and level mark, the row linking to the part on the topic's page.
function part(s: GuideSection, i: number, n: number, href: string, track: Track): string {
  const mark = markButton(s.levels, `s${String(i)}`, levelsLabel(s.levels, track.explain));
  return `<li><span class="ix-row"><a class="ix-cover" href="${escapeHtml(href)}"><span class="tpp-n">${num(n)}</span><span class="ix-name">${s.heading}</span></a>${mark}${CHEVRON}</span></li>`;
}

// Up next in each grouping at each level of the filter: by category, and by level at the lowest step the topic holds.
function upNext(track: Track, ref: TopicRef): string {
  const rows = placed(track, ref);
  const step = rows.flatMap(({ attrs }) => /data-step="(\w+)"/.exec(attrs)?.[1] ?? []).at(0);
  return rows
    .flatMap(({ attrs, around: a }) => {
      const e = a.next;
      if (e === undefined || (attrs.includes("data-step") && !attrs.includes(`data-step="${step ?? ""}"`))) return [];
      const order = attrs.includes('data-order="path"') ? "path" : "categories";
      const levels = e.link.includes("data-path-step") ? [e.level] : refLevels(e.ref, track.explain);
      const caps = escapeHtml(a.restart ? track.t.startOver : track.t.upNext);
      return [
        `<div class="tpp-next" data-order="${order}" data-at="${a.at.join(" ")}"><p class="tpp-caps">${caps}</p><a class="tpp-link" ${e.link}><strong>${escapeHtml(e.title)}</strong>${bars(levels.length > 0 ? levels : [e.level], track.explain)}${CHEVRON}<span class="tpp-sum">${escapeHtml(e.summary)}</span></a></div>`,
      ];
    })
    .join("");
}

export function topicParts(track: Track, ref: TopicRef, p: TopicParts): string {
  const { lang, explain, t } = track;
  const url = topicUrl(explain, lang, ref);
  let n = 0;
  const rows = p.all.map((s, i) => part(s, i, s.kind === "summary" ? 0 : ++n, `${url}#${p.ids[i] ?? ""}`, track));
  return `<div class="tpp" data-sp-fragment>
<h2 class="tpp-title"><span class="tpp-flag" aria-hidden="true">${lang.flag}</span>${escapeHtml(topicTitle(ref, explain))}</h2>
<p class="tpp-props">${p.props}</p>
<p class="tpp-lead doc">${p.lead}</p>
<h3 class="tpp-caps">${escapeHtml(t.contents)}</h3>
<ol class="ix-rows tpp-rows">${rows.join("")}</ol>
${upNext(track, ref)}
</div>`;
}
