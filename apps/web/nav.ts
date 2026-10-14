// The sidebar menu: its head (the track switcher, the search, the index and the cheatsheets), the order
// switch, and every topic of the track in both orders: by category (sections, each topic with its range)
// and the study path (levels, each with its steps). The switch shows one; the level filter hides what
// starts above it, and the search what does not match.
import { topicTitle } from "../../scripts/content.ts";
import { type Explain, localize, SITE, type TopicRef } from "../../scripts/lib.ts";
import { refRange } from "../../scripts/levels.ts";
import { explainsOf, type Track } from "./context.ts";
import { ui } from "./ui.ts";
import { pathMenu } from "./path.ts";
import { levelAttrs, listBadge, refsRange } from "./parts.ts";
import { escapeHtml } from "./html.ts";
import { homeUrl, sheetsUrl, topicUrl, trackUrl } from "./urls.ts";

// Grouping of the topic lists: by level, along the study path, or by category. The choice lives in the browser,
// like the theme (client.ts); views.css shows the lists of the chosen order.
export function orderButtons(explain: Explain): string {
  const t = ui(explain);
  return `<button type="button" data-set-order="path">${escapeHtml(t.byLevel)}</button><button type="button" data-set-order="categories">${escapeHtml(t.categories)}</button>`;
}

// The tracks a reader switches between: each language being learned in each language it is explained
// in, and the home page, where every language is listed.
function trackSwitch(track: Track): string {
  const { ctx, explain, lang } = track;
  const t = ui(explain);
  const groups = ctx.languages.map((l) => {
    const links = explainsOf(l)
      .map((e) => {
        const on = l === lang && e === explain ? ' class="on" aria-current="page"' : "";
        return `<a href="${trackUrl(e, l)}" hreflang="${e}" lang="${e}"${on}>${escapeHtml(ui(e).explained)}</a>`;
      })
      .join("");
    return `<div class="switch-group"><p><span aria-hidden="true">${l.flag}</span> ${escapeHtml(localize(l.name, explain))}</p>${links}</div>`;
  });
  const summary = `<summary><span class="switch-flag" aria-hidden="true">${lang.flag}</span><span class="switch-name"><strong>${escapeHtml(localize(lang.name, explain))}</strong><small>${escapeHtml(t.explained)}</small></span><span class="caret" aria-hidden="true">▾</span></summary>`;
  return `<details class="track-switch">${summary}<div class="switch-list">${groups.join("")}<a class="switch-home" href="${homeUrl(explain)}">${escapeHtml(t.chooseLanguage)}</a></div></details>`;
}

// The sidebar head: the logo, which small screens show here in place of the top bar's (media.css), the
// track switcher, the search (client-search.ts shows it), and the track's index and cheatsheets.
export function navHead(track: Track, at: "index" | "sheets" | null): string {
  const { explain, lang } = track;
  const t = ui(explain);
  const here = (on: boolean): string => (on ? ' class="nav-track on" aria-current="page"' : ' class="nav-track"');
  const sheetsAttr = at === "sheets" ? ' class="nav-sheets on" aria-current="page"' : ' class="nav-sheets"';
  return [
    `<a class="nav-brand" href="${homeUrl(explain)}">${escapeHtml(SITE.name)}</a>`,
    trackSwitch(track),
    `<label class="nav-search" hidden><span class="sr-only">${escapeHtml(t.search)}</span><input type="search" placeholder="${escapeHtml(t.search)}" autocomplete="off"><kbd aria-hidden="true">/</kbd></label>`,
    `<a${here(at === "index")} href="${trackUrl(explain, lang)}"><span aria-hidden="true">📑</span><span class="name">${escapeHtml(t.index)}</span></a>`,
    `<a${sheetsAttr} href="${sheetsUrl(explain, lang)}"><span aria-hidden="true">🗂️</span><span class="name">${escapeHtml(t.sheets)}</span></a>`,
  ].join("\n");
}

export function trackNav(track: Track, current?: TopicRef): string {
  const { ctx, explain, lang } = track;
  const t = ui(explain);
  const refs = ctx.refs;
  const out: string[] = [];
  for (const section of lang.sections) {
    const inSection = refs.filter((r) => r.lang === lang.code && r.section === section);
    const range = refsRange(inSection, explain);
    out.push(`<h4${levelAttrs(range)}><span class="name">${escapeHtml(localize(section.title, explain))}</span>${listBadge(range)}</h4>`);
    for (const ref of inSection) {
      const own = refRange(ref, explain);
      const name = `<span class="name">${escapeHtml(topicTitle(ref, explain))}</span>${listBadge(own)}`;
      if (ref.topic) {
        const on = current === ref ? ' class="on" aria-current="page"' : "";
        out.push(`<a href="${topicUrl(explain, lang, ref)}"${levelAttrs(own)}${on}>${name}</a>`);
      } else {
        out.push(`<div class="todo"${levelAttrs(own)}>${name}</div>`);
      }
    }
  }
  return [
    navHead(track, current === undefined ? "index" : null),
    `<div class="nav-order"><span class="nav-label">${escapeHtml(t.topics)}</span><div class="seg" role="group" aria-label="${escapeHtml(t.grouping)}">${orderButtons(explain)}</div></div>`,
    `<div class="nav-list" data-order="categories">${out.join("\n")}</div>`,
    `<div class="nav-list" data-order="path">${pathMenu(track.path, explain, current)}</div>`,
  ].join("\n");
}
