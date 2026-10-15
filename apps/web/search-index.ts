// The search data of a track, written beside its pages as search.json: every written topic with its
// section of the track, then each section of each topic's guide with its anchor on the topic page,
// all with their levels. The top bar's search fetches it on its first focus (client-search.ts).
import { topicTitle } from "../../scripts/content.ts";
import { localize } from "../../scripts/lib.ts";
import { refRange } from "../../scripts/levels.ts";
import type { Track } from "./context.ts";
import { guideParts } from "./guide.ts";
import { anchorIds, listBadge } from "./parts.ts";
import type { SearchData, SearchEntry } from "./search-match.ts";
import { searchUrl, topicUrl } from "./urls.ts";

export function searchData(track: Track): SearchData {
  const { explain, lang, written } = track;
  const topics: SearchEntry[] = [];
  const sections: SearchEntry[] = [];
  for (const ref of written) {
    const range = refRange(ref, explain);
    if (ref.topic === null || range === null) continue;
    const title = topicTitle(ref, explain);
    const url = topicUrl(explain, lang, ref);
    topics.push({ kind: "topic", title, context: localize(ref.section.title, explain), url, ...range, badge: listBadge(range) });
    // The anchors the topic page gives its parts, the cheatsheet first; the cheatsheet itself is not a row.
    const parts = guideParts(ref.topic, explain);
    const ids = anchorIds(parts.map((p) => p.title));
    parts.forEach((p, i) => {
      if (p.kind === "cheatsheet") return;
      sections.push({
        kind: "section",
        title: p.title,
        context: title,
        url: `${url}#${ids[i] ?? ""}`,
        ...p.range,
        badge: listBadge(p.range),
      });
    });
  }
  return { track: track.title, entries: [...topics, ...sections] };
}

export function searchFile(track: Track): void {
  track.ctx.add(searchUrl(track.explain, track.lang), JSON.stringify(searchData(track)), false);
}
