// The page shell: head, top bar with its search, layout, the panels and the bottom bar, and the scripts that run before first paint.
import { type Explain, filled, LEVELS, type Variety } from "../../scripts/lib.ts";
import type { HeadChange, PageFacts } from "./context.ts";
import { bottomBar, breadcrumb, type Choice, chips, type Crumb, credits, languageMenu, panels, searchBox, themeButton } from "./chrome.ts";
import { escapeHtml } from "./html.ts";
import { type Ui, ui } from "./ui.ts";

export type PageKind = "home" | "track" | "topic" | "sheets" | "sheet" | "credits" | "404";

export interface PageOptions {
  kind: PageKind;
  lang: Explain;
  title: string;
  description: string;
  path: string;
  // The same page in each explanation language; x-default names the page for every other language: the
  // one a page gives, else its English version, else its first.
  alternates?: { lang: string; path: string }[];
  // The varieties of the language being learned, the default first: the page shows the default's
  // elements until the reader chooses another.
  varieties?: Variety[] | undefined;
  // The page in each explanation language it is read in.
  read?: Choice[];
  // The level filter applies to the page.
  level?: boolean;
  // Where the page sits, after the site itself.
  crumbs?: Crumb[];
  // The search data the top bar's search looks through: the track's, or on a home page every track's.
  search?: string[];
  nav?: string;
  rail?: string;
  main: string;
  // The next page, per grouping and level, for the bottom bar on phones (sequence.ts).
  next?: string;
  // The page's own body in place of the top bar, the layout, the bottom bar and the panels: a page drawn
  // edge to edge in the frame of frame.css (data-frame).
  body?: string;
  // What the page is about, for its facts (context.ts PageFacts).
  about?: Pick<PageFacts, "name" | "lang" | "topic" | "section" | "sheet" | "range" | "minutes">;
  dev: boolean;
  siteUrl: string;
}

// A page as its builder gives it; the build adds its own options.
export type PageInput = Omit<PageOptions, "dev" | "siteUrl">;

// The page's alternates as its head lists them: x-default names the page for every other language, the
// one a page gives, else its English version, else its first.
function alternatesOf(o: PageInput): { lang: string; path: string }[] {
  const given = o.alternates ?? [];
  const fallback = given.find((a) => a.lang === "en") ?? given[0];
  return given.some((a) => a.lang === "x-default") || fallback === undefined
    ? given
    : [...given, { lang: "x-default", path: fallback.path }];
}

export const pageFacts = (o: PageInput, sitemap: boolean): PageFacts => ({
  path: o.path,
  kind: o.kind,
  explain: o.lang,
  title: o.title,
  description: o.description,
  alternates: alternatesOf(o),
  sitemap,
  ...o.about,
});

// Applies saved viewer preferences before first paint, and holds back lanes client.ts places (data-lanes).
const PREFS = `var d=document.documentElement,p=new URLSearchParams(location.search),s=localStorage,l=(p.get("level")||"").toUpperCase(),v=p.get("view");if(${JSON.stringify(LEVELS)}.indexOf(l)>=0)s.setItem("ln-level",l);if(v==="cheatsheet"||v==="extended")s.setItem("ln-view",v);d.dataset.level=s.getItem("ln-level")||"${LEVELS.at(-1) ?? ""}";d.dataset.view=s.getItem("ln-view")==="cheatsheet"?"cheatsheet":"extended";d.dataset.order=s.getItem("ln-order")==="path"?"path":"categories";var t=s.getItem("ln-theme");if(t&&t!=="auto")d.dataset.theme=t;if(!CSS.supports("display","grid-lanes"))d.dataset.lanes="wait"`;
// A page with varieties keeps the reader's choice per language being learned, ln-variety-es; the address
// (?variety=es-es) wins, and the page opens on the default it names.
const VARIETY_PREFS = `;var vs=d.dataset.varieties.split(" "),f=function(x){return vs.filter(function(y){return y.toLowerCase()===x.toLowerCase()})[0]},k="ln-variety-"+vs[0].split("-")[0],a=f(p.get("variety")||"");if(a)s.setItem(k,a);a=f(s.getItem(k)||"");if(a)d.dataset.variety=a`;
const prefs = (varieties: boolean): string => `try{${PREFS}${varieties ? VARIETY_PREFS : ""}}catch(e){}`;

// Runs right after the sidebar, before first paint: restores the scroll position the same menu had on
// the previous page (client.ts saves it on leaving), then brings the current page's entry into view:
// by level, the step its address names (?step=a1), else the highest step the level filter shows.
const NAV_SCROLL = `(function(){var n=document.getElementById("sidebar"),o=document.documentElement.dataset.order||"categories",k=n.querySelector(".nav-track").getAttribute("href")+"#"+o+n.childElementCount;n.dataset.key=k;try{var v=JSON.parse(sessionStorage.getItem("ln-nav"));if(v&&v.k===k)n.scrollTop=v.t}catch(e){}var w=(new URLSearchParams(location.search).get("step")||"").toUpperCase(),s=[].filter.call(n.querySelectorAll('[data-order="path"] a.on'),function(a){return a.offsetHeight>0}),c=o==="path"?s.filter(function(a){return a.dataset.level===w})[0]||s.pop():n.querySelector(".nav-list [aria-current=page]");if(c){var r=c.getBoundingClientRect(),b=n.getBoundingClientRect();if(r.top<b.top||r.bottom>b.bottom)n.scrollTop+=r.top-b.top-(b.height-r.height)/2}})()`;

// The default variety on the page, and the ones the reader chooses between.
const varietyAttrs = (varieties: Variety[] | undefined): string =>
  varieties === undefined ? "" : ` data-variety="${varieties[0] ?? ""}" data-varieties="${varieties.join(" ")}"`;

// change: the build's head option's change to this page (context.ts HeadChange).
export function page(o: PageOptions, change: HeadChange = {}): string {
  const t = ui(o.lang);
  const url = (path: string): string => `${o.siteUrl}${path}`;
  const title = change.title ?? o.title;
  const description = change.description ?? o.description;
  const canonical = url(change.canonical ?? o.path);
  const alternates = (change.alternates === false ? [] : alternatesOf(o))
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${url(a.path)}">`)
    .join("\n  ");
  const hasNav = filled(o.nav);
  // A page with a menu or a level filter keeps the bottom bar on phones, where the top bar's chips hide.
  const hasBar = hasNav || o.level === true;
  const read = (o.read ?? []).length > 1 ? languageMenu(t.read, o.read ?? []) : "";
  return `<!doctype html>
<html lang="${o.lang}" data-page="${o.kind}" data-dev="${o.dev ? 1 : 0}"${o.body === undefined ? "" : " data-frame"}${varietyAttrs(o.varieties)}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1${o.body === undefined ? "" : ", viewport-fit=cover"}">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${o.kind === "404" ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
  ${alternates}
  <meta property="og:type" content="${escapeHtml(change.type ?? "website")}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <link rel="stylesheet" href="/levels.css">
  <link rel="stylesheet" href="/style.css">
  <script>${prefs(o.varieties !== undefined)}</script>${(change.tags ?? []).map((tag) => `\n  ${tag}`).join("")}
</head>
<body${hasBar ? ' class="has-bar"' : ""}>
  ${o.body ?? chrome(o, t, hasNav, hasBar, read)}
  <script src="/client.js" defer></script>
</body>
</html>
`;
}

// The standard page around the main content: the top bar, the layout with its menu and rail, the bottom bar
// and the panels.
function chrome(o: PageOptions, t: Ui, hasNav: boolean, hasBar: boolean, read: string): string {
  return `<header class="topbar">
    ${breadcrumb(o, t)}
    ${searchBox(o, t)}
    <div class="tools">${chips({ explain: o.lang, level: o.level, varieties: o.varieties })}${read}${credits(o, false)}${themeButton(t, false)}</div>
  </header>
  <div class="layout${hasNav ? "" : " no-nav"}${filled(o.rail) ? " has-rail" : ""}">
    ${hasNav ? `<nav class="sidebar" id="sidebar">${o.nav}</nav><script>${NAV_SCROLL}</script>` : ""}
    <main class="content">${o.main}</main>
    ${filled(o.rail) ? `<aside class="rail">${o.rail}</aside>` : ""}
  </div>
  ${hasBar ? bottomBar(o, t, hasNav) : ""}
  ${panels(o, t, hasBar)}`;
}
