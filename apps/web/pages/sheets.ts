// Cheatsheet pages: the index of a track's sheets and one page per sheet.
import type { Explain } from "../../../scripts/lib.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { pageTools } from "../chrome.ts";
import { page } from "../layout.ts";
import { navHead } from "../nav.ts";
import { badge, editUrl } from "../parts.ts";
import { escapeHtml } from "../html.ts";
import { sheetsUrl, sheetUrl, trackUrl } from "../urls.ts";
import { type Sheet, sheetsOf } from "./sheet-content.ts";

export function sheetPages(track: Track): void {
  const { ctx, lang, explain, t, title: trackTitle } = track;
  const { o } = ctx;
  const sheets = sheetsOf(track);
  const groups = { levels: t.levels, progressive: t.progressive, sections: t.sections, topics: t.topics } as const;
  const groupKeys = Object.keys(groups) as (keyof typeof groups)[];
  const sheetNav = (current?: Sheet): string =>
    navHead(track, current === undefined ? "sheets" : null) +
    `<div class="nav-list">${groupKeys
      .flatMap((g) => {
        const list = sheets.filter((s) => s.group === g);
        if (list.length === 0) return [];
        return [
          `<h4>${escapeHtml(groups[g])}</h4>`,
          ...list.map(
            (s) =>
              `<a href="${sheetUrl(explain, lang, s.id)}"${s === current ? ' class="on" aria-current="page"' : ""}><span class="name">${escapeHtml(s.label)}</span></a>`,
          ),
        ];
      })
      .join("\n")}</div>`;

  const shared = (pathFor: (e: Explain) => string) => ({
    lang: explain,
    alternates: alternates(pathFor, track.explains),
    read: readChoices(explain, pathFor, track.explains),
    varieties: lang.varieties,
    dev: o.dev,
    siteUrl: o.siteUrl,
  });
  const trackCrumb = { label: trackTitle, href: trackUrl(explain, lang), icon: lang.flag };

  const indexHtml = groupKeys
    .map((g) => {
      const list = sheets.filter((s) => s.group === g);
      if (list.length === 0) return "";
      return `<section class="part"><h2>${escapeHtml(groups[g])}</h2><ul class="topic-list">${list
        .map((s) => `<li><a href="${sheetUrl(explain, lang, s.id)}">${escapeHtml(s.label)}</a> ${badge(s.range)}</li>`)
        .join("")}</ul></section>`;
    })
    .join("");
  ctx.add(
    sheetsUrl(explain, lang),
    page({
      ...shared((e) => sheetsUrl(e, lang)),
      kind: "sheets",
      title: `${t.sheets} — ${trackTitle}`,
      description: `${t.sheets}: ${trackTitle}, ${t.explained}.`,
      path: sheetsUrl(explain, lang),
      crumbs: [trackCrumb, { label: t.sheets }],
      nav: sheetNav(),
      main: `<article class="doc"><header class="doc-head"><div class="title-row"><span class="page-icon" aria-hidden="true">${lang.flag}</span><h1>${escapeHtml(t.sheets)}</h1></div></header><blockquote><p>${escapeHtml(t.sheetsIntro)}</p></blockquote><div class="sheet-index lanes">${indexHtml}</div></article>`,
    }),
  );

  for (const s of sheets) {
    ctx.add(
      sheetUrl(explain, lang, s.id),
      page({
        ...shared((e) => sheetUrl(e, lang, s.id)),
        kind: "sheet",
        title: `${s.title} — ${trackTitle}`,
        description: `${s.title}: ${trackTitle}, ${t.explained}.`,
        path: sheetUrl(explain, lang, s.id),
        crumbs: [trackCrumb, { label: t.sheets, href: sheetsUrl(explain, lang) }, { label: s.label }],
        nav: sheetNav(s),
        main: `<article class="doc sheet">${s.html}${pageTools(t, s.path === undefined ? undefined : editUrl(s.path))}</article>`,
      }),
    );
  }
}
