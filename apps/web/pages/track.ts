// A track's index in the frame (frame.css, track.css): a glass Home button sharing the title row with the course's
// flag and name (on a wide screen the topic count ends the order switch's row, on a phone the title's), the count
// the topics the chosen level shows, the order switch as a segmented control, the topics in both
// orders with their level marks (track-parts.ts) and the level popover they open, and the Home's glass toolbar: the
// Level button, which opens the same popover headed by the course, the variety menu on a course with varieties, and
// Read in; a phone's bar ends in a round Search button that opens the field (track-bar.css). The order switch, the level filter and the variety switch are the client's own (data-set-order,
// data-set-level, data-set-variety); client-track.ts follows their state in the menus and the switch, client-chips.ts
// the count.
import { count, type Explain, LEVELS, localize, lv, say, SITE, type TopicRef } from "../../../scripts/lib.ts";
import { refRange } from "../../../scripts/levels.ts";
import { varietyName } from "../../../scripts/text.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { escapeHtml } from "../html.ts";
import { ranged, refsRange } from "../parts.ts";
import { closeButton, readMenu, results, searchButton, searchForm } from "../toolbar.ts";
import { courseEntry, type LevelEntry, levelData, levelPopover } from "../level-popover.ts";
import { HOME } from "../glyphs.ts";
import { byCategory, byLevel, GLOBE, levelButton, varietyMenu } from "../track-parts.ts";
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
  const body = `<main class="hm-main ix-main">
<a class="ix-up glass" href="${homeUrl(explain)}" aria-label="${escapeHtml(SITE.name)}">${HOME}</a>
<div id="hm-cards">
<header class="ix-head">
<div class="ix-line"><h1 class="ix-name-h"><span class="ix-flag" aria-hidden="true">${lang.flag}</span><span aria-hidden="true">${escapeHtml(localize(lang.name, explain))}</span><span class="sr-only">${escapeHtml(title)}</span></h1><span class="ix-count" data-counts="${escapeHtml(countsByLevel(written, explain))}">${escapeHtml(count("topics", explain, written.length))}</span></div>
<div class="ix-seg" role="group" aria-label="${escapeHtml(t.grouping)}">${seg}</div>
</header>
<div class="ix-flow" data-order="categories">${categories}</div>
<div class="ix-flow" data-order="path">${path}</div>
</div>
${results(
  t,
  searchFilters(
    t,
    explain,
    ctx.languages,
    readChoices(explain, (e) => trackUrl(e, lang), track.explains),
    lang.code,
  ),
)}
</main>
<div class="ix-fade" aria-hidden="true"></div>
<nav class="hm-bar ix-bar">
${searchForm(t)}
<div class="hm-group glass">
${levelButton(explain, { level: t.level, all: t.allLevels }, "lv-pop", "ix-btn ix-level", "ix-label", course)}
${variety}
${readMenu(
  t,
  readChoices(explain, (e) => trackUrl(e, lang), track.explains),
)}
</div>
${searchButton(t)}
${closeButton(t)}
${varieties.length === 0 ? "" : varietyMenu(t.variety, varieties)}
</nav>
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
