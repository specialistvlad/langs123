// A track's index in the split view (split.ts): the left pane holds the title row (the Home button, the list button, the
// course's flag and name; on a phone the topic count ends the row), the search, the order switch as a segmented
// control with the count, and the topics in both orders with their level marks (track-parts.ts); a topic is an item
// that opens its parts in the right pane (topic-parts.ts, which the topic page declares as its fragment), whose tools
// are the Level, Variety and Read in group and whose placeholder is "Choose a topic". The list, with the course's
// heading, is the fragment and the group the tools the Home's right pane takes when a course is chosen there. A phone
// keeps the Home layout of one screen: the group sits in the bottom bar with a round Search button that opens the
// field (track-bar.css). The Level button opens the level popover headed by the course. The order switch, the level
// filter and the variety switch are the client's own (data-set-order, data-set-level, data-set-variety);
// client-track.ts follows their state in the menus and the switch, client-chips.ts the count.
import { count, type Explain, LEVELS, localize, lv, say, SITE, type TopicRef } from "../../../scripts/lib.ts";
import { refRange } from "../../../scripts/levels.ts";
import { varietyName } from "../../../scripts/text.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { escapeHtml } from "../html.ts";
import { ranged, refsRange } from "../parts.ts";
import { closeButton, readMenu, results, searchButton, searchForm } from "../toolbar.ts";
import { courseEntry, type LevelEntry, levelData, levelPopover } from "../level-popover.ts";
import { HOME } from "../glyphs.ts";
import { choose, listButton, split } from "../split.ts";
import { byCategory, byLevel, CHOOSE_TOPIC, GLOBE, levelButton, varietyMenu } from "../track-parts.ts";
import { searchFilters } from "../search-filters.ts";
import { homeUrl, trackUrl } from "../urls.ts";

// The topic count at each chosen level, as the page says it: a topic counts from its lowest level up, and a topic
// with no level counts at every one (client-chips.ts picks the text of the chosen level).
function countsByLevel(refs: TopicRef[], explain: Explain): string {
  const lows = refs.map((r) => lv(refRange(r, explain)?.from ?? null));
  return JSON.stringify(
    Object.fromEntries(LEVELS.map((level) => [level, count("topics", explain, lows.filter((low) => low <= lv(level)).length)])),
  );
}

export function trackIndex(track: Track): void {
  const { ctx, lang, explain, t, title, langRefs, written } = track;
  const varieties = (lang.varieties ?? []).map((v) => ({ code: v, name: varietyName(v, explain) }));
  const seg = [
    ["categories", t.categories],
    ["path", t.byLevel],
  ]
    .map(
      ([order, label]) => `<button type="button" data-set-order="${order ?? ""}" aria-pressed="false">${escapeHtml(label ?? "")}</button>`,
    )
    .join("");
  const entries: Record<string, LevelEntry> = {};
  const categories = byCategory(track, entries);
  const path = byLevel(track, entries);
  // The toolbar's Level button opens the popover for the course: its entry holds the levels its topics cover.
  const held = courseEntry(localize(lang.name, explain), langRefs, explain);
  entries[lang.code] = held;
  const course = { key: lang.code, levels: Object.keys(held.l) };
  const variety =
    varieties.length === 0
      ? ""
      : `<button type="button" class="ix-btn ix-variety" popovertarget="ix-varieties" aria-haspopup="menu">${GLOBE}<span class="ix-label"><span class="sr-only">${escapeHtml(say("labelled", explain, { label: t.variety, value: "" }))}</span><span data-variety-label>${escapeHtml(varieties[0]?.name ?? "")}</span></span></button>`;
  const read = readChoices(explain, (e) => trackUrl(e, lang), track.explains);
  const group = (attrs: string): string =>
    `<div class="hm-group glass"${attrs}>
${levelButton(explain, { level: t.level, all: t.allLevels }, "lv-pop", "ix-btn ix-level", "ix-label", course)}
${variety}
${readMenu(t, read)}
</div>`;
  const flag = `<span class="ix-flag" aria-hidden="true">${lang.flag}</span>`;
  const name = escapeHtml(localize(lang.name, explain));
  const counts = `data-counts="${escapeHtml(countsByLevel(written, explain))}"`;
  const total = escapeHtml(count("topics", explain, written.length));
  const up = `<a class="ix-up glass" href="${homeUrl(explain)}" aria-label="${escapeHtml(SITE.name)}">${HOME}</a>`;
  // The left pane: the title row (Home, the list button, the course; on a phone the count ends it), the search, and
  // the list, whose head, switch and topics are the fragment the Home's right pane takes (split.ts).
  const left = `<div class="sp-title">
${up}
${listButton(t)}
<h1 class="ix-name-h">${flag}<span aria-hidden="true">${name}</span><span class="sr-only">${escapeHtml(title)}</span></h1><span class="ix-count ix-count-t" ${counts}>${total}</span>
</div>
<nav class="hm-bar ix-bar">
${searchForm(t)}
${group("")}
${searchButton(t)}
${closeButton(t)}
${varieties.length === 0 ? "" : varietyMenu(t.variety, varieties, " data-sp-extras")}
</nav>
<main class="hm-main ix-main">
<div id="hm-cards" class="ix-frag" data-sp-fragment>
<h2 class="ix-name-h ix-frag-h">${flag}${name}</h2>
<header class="ix-head"><div class="ix-seg" role="group" aria-label="${escapeHtml(t.grouping)}">${seg}</div><span class="ix-count" ${counts}>${total}</span></header>
<div class="ix-flow" data-order="categories">${categories}</div>
<div class="ix-flow" data-order="path">${path}</div>
</div>
${results(t, searchFilters(t, explain, ctx.languages, read, lang.code))}
</main>
<div class="ix-fade" aria-hidden="true"></div>`;
  const body = `${split({
    t,
    cls: "sp-home sp-track",
    left,
    tools: group(" data-sp-tools"),
    body: choose({ title: t.chooseTopic, hint: t.chooseTopicHint, icon: CHOOSE_TOPIC }),
  })}
${levelPopover(explain)}
${levelData(entries)}`;
  ctx.add({
    kind: "track",
    lang: explain,
    title: `${title} — ${SITE.name}`,
    description: `${title}, ${t.explained}: ${t.written(written.length, langRefs.length)}.`,
    path: trackUrl(explain, lang),
    alternates: alternates((e) => trackUrl(e, lang), track.explains),
    read: readChoices(explain, (e) => trackUrl(e, lang), track.explains),
    level: true,
    varieties: lang.varieties,
    body,
    about: { name: title, lang: lang.code, ...ranged(refsRange(langRefs, explain)) },
  });
}
