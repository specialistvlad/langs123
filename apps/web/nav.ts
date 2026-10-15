// The sidebar menu: its head (the index), the order
// switch, and every topic of the track in both orders: by category (sections, each topic with its range)
// and the study path (levels, each with its steps). The switch shows one; the level filter hides what
// starts above it.
import { topicTitle } from "../../scripts/content.ts";
import { type Explain, explainName, localize, SITE, type TopicRef } from "../../scripts/lib.ts";
import { refRange } from "../../scripts/levels.ts";
import type { Crumb, LearnChoice } from "./chrome.ts";
import { explainsOf, type Track } from "./context.ts";
import { ui } from "./ui.ts";
import { pathMenu } from "./path.ts";
import { levelAttrs, listBadge, refsRange } from "./parts.ts";
import { escapeHtml } from "./html.ts";
import { homeUrl, topicUrl, trackUrl } from "./urls.ts";

// The track's crumb in the breadcrumb, opening into every language to learn: each in the reader's language
// where it is explained in it, else in the first language it is explained in, named in its own words
// (English, Español) as the language menu names it.
export function trackCrumb(track: Track, title: string): Crumb {
  const { ctx, explain, lang } = track;
  const menu: LearnChoice[] = ctx.languages.map((l) => {
    const explains = explainsOf(l);
    const here = explains.includes(explain);
    const other = explains[0] ?? explain;
    return {
      flag: l.flag,
      label: localize(l.name, explain),
      href: trackUrl(here ? explain : other, l),
      on: l === lang,
      ...(here ? {} : { note: explainName(other) }),
    };
  });
  return { label: title, icon: lang.flag, menu };
}

// Grouping of the topic lists: by level, along the study path, or by category. The choice lives in the browser,
// like the theme (client.ts); views.css shows the lists of the chosen order.
export function orderButtons(explain: Explain): string {
  const t = ui(explain);
  return `<button type="button" data-set-order="path">${escapeHtml(t.byLevel)}</button><button type="button" data-set-order="categories">${escapeHtml(t.categories)}</button>`;
}

// The sidebar head: the logo, which small screens show here in place of the top bar's (media.css), and
// the track's index. A topic's cheatsheet is section 00 of its page.
export function navHead(track: Track, at: "index" | null): string {
  const { explain, lang } = track;
  const t = ui(explain);
  const here = at === "index" ? ' class="nav-track on" aria-current="page"' : ' class="nav-track"';
  return [
    `<a class="nav-brand" href="${homeUrl(explain)}">${escapeHtml(SITE.name)}</a>`,
    `<a${here} href="${trackUrl(explain, lang)}"><span aria-hidden="true">📑</span><span class="name">${escapeHtml(t.index)}</span></a>`,
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
