// A track's navigation on its cheatsheet pages: the sidebar's head (the logo and the track's index), and the
// track's crumb in the breadcrumb, opening into every language to learn.
import { explainName, localize, SITE } from "../../scripts/lib.ts";
import type { Crumb, LearnChoice } from "./chrome.ts";
import { explainsOf, type Track } from "./context.ts";
import { ui } from "./ui.ts";
import { escapeHtml } from "./html.ts";
import { homeUrl, trackUrl } from "./urls.ts";

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
