// A track's index in the frame (frame.css, track.css): a glass up link to Home, the course's flag and name with
// its topic count, the order switch as a segmented control, the topics in both orders (track-parts.ts), and
// the Home's glass toolbar with the level menu, the variety menu on a course with varieties, and Read in. The
// order switch, the level filter and the variety switch are the client's own (data-set-order, data-set-level,
// data-set-variety); client-track.ts follows their state in the menus and the switch.
import { count, localize, SITE } from "../../../scripts/lib.ts";
import { varietyName } from "../../../scripts/text.ts";
import { levelPanel } from "../chrome.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { escapeHtml } from "../html.ts";
import { ranged, refsRange } from "../parts.ts";
import { closeButton, readMenu, results, searchForm } from "../toolbar.ts";
import { BACK, byCategory, byLevel, FILTER, GLOBE, levelMenu, varietyMenu } from "../track-parts.ts";
import { homeUrl, trackUrl } from "../urls.ts";

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
  const all = escapeHtml(t.allLevels);
  const variety =
    varieties.length === 0
      ? ""
      : `<button type="button" class="ix-btn ix-variety" popovertarget="ix-varieties" aria-haspopup="menu">${GLOBE}<span class="ix-label"><span class="sr-only">${escapeHtml(t.variety)}: </span><span data-variety-label>${escapeHtml(varieties[0]?.name ?? "")}</span></span></button>`;
  const body = `<a class="ix-up glass" href="${homeUrl(explain)}" aria-label="${escapeHtml(SITE.name)}">${BACK}</a>
<main class="hm-main ix-main">
<div id="hm-cards">
<header class="ix-head">
<div class="ix-line"><h1 class="ix-name-h"><span class="ix-flag" aria-hidden="true">${lang.flag}</span><span aria-hidden="true">${escapeHtml(localize(lang.name, explain))}</span><span class="sr-only">${escapeHtml(title)}</span></h1><span class="ix-count">${escapeHtml(count("topics", explain, written.length))}</span></div>
<div class="ix-seg" role="group" aria-label="${escapeHtml(t.grouping)}">${seg}</div>
</header>
<div class="ix-flow" data-order="categories">${byCategory(track)}</div>
<div class="ix-flow" data-order="path">${byLevel(track)}</div>
</div>
${results(t)}
</main>
<div class="ix-fade" aria-hidden="true"></div>
<nav class="hm-bar ix-bar">
${searchForm(t)}
<div class="hm-group glass">
<button type="button" class="ix-btn ix-level" popovertarget="ix-levels" aria-haspopup="menu">${FILTER}<span class="ix-label"><span class="sr-only">${escapeHtml(t.level)}: </span><span data-level-label data-all="${all}" data-up-to="${escapeHtml(`${t.upTo} {level}`)}">${all}</span></span></button>
${variety}
${readMenu(
  t,
  readChoices(explain, (e) => trackUrl(e, lang), track.explains),
)}
</div>
${closeButton(t)}
${levelMenu(explain, langRefs, { level: t.level, hint: t.levelHidden, all: t.allLevels })}
${varieties.length === 0 ? "" : varietyMenu(t.variety, varieties)}
</nav>
${levelPanel(t)}`;
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
    main: "",
    body,
    about: { name: title, lang: lang.code, ...ranged(refsRange(langRefs, explain)) },
  });
}
