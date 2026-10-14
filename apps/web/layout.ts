// The page shell: head, top bar, layout, the panels and the bottom bar, and the scripts that run before first paint.
import { type Explain, filled, LEVELS, type Variety } from "../../scripts/lib.ts";
import { bottomBar, breadcrumb, type Choice, chips, type Crumb, credits, languageMenu, panels, themeButton } from "./chrome.ts";
import { escapeHtml } from "./html.ts";
import { ui } from "./ui.ts";

export interface PageOptions {
  kind: "home" | "track" | "topic" | "sheets" | "sheet" | "credits" | "404";
  lang: Explain;
  title: string;
  description: string;
  path: string;
  // The same page in each explanation language; the home page adds x-default.
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
  nav?: string;
  rail?: string;
  main: string;
  // The next page, per grouping and level, for the bottom bar on phones (sequence.ts).
  next?: string;
  dev: boolean;
  siteUrl: string;
}

// Applies saved viewer preferences before first paint.
const PREFS = `var d=document.documentElement,p=new URLSearchParams(location.search),s=localStorage,l=(p.get("level")||"").toUpperCase(),v=p.get("view");if(${JSON.stringify(LEVELS)}.indexOf(l)>=0)s.setItem("ln-level",l);if(v==="cheatsheet"||v==="extended")s.setItem("ln-view",v);d.dataset.level=s.getItem("ln-level")||"${LEVELS.at(-1) ?? ""}";d.dataset.view=s.getItem("ln-view")==="cheatsheet"?"cheatsheet":"extended";d.dataset.order=s.getItem("ln-order")==="path"?"path":"categories";var t=s.getItem("ln-theme");if(t&&t!=="auto")d.dataset.theme=t`;
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

export function page(o: PageOptions): string {
  const t = ui(o.lang);
  const url = (path: string): string => `${o.siteUrl}${path}`;
  const alternates = (o.alternates ?? []).map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${url(a.path)}">`).join("\n  ");
  const hasNav = filled(o.nav);
  const read = (o.read ?? []).length > 1 ? languageMenu(t.read, o.read ?? []) : "";
  return `<!doctype html>
<html lang="${o.lang}" data-page="${o.kind}" data-dev="${o.dev ? 1 : 0}"${varietyAttrs(o.varieties)}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(o.title)}</title>
  <meta name="description" content="${escapeHtml(o.description)}">
  ${o.kind === "404" ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url(o.path)}">`}
  ${alternates}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(o.title)}">
  <meta property="og:description" content="${escapeHtml(o.description)}">
  <meta property="og:url" content="${url(o.path)}">
  <link rel="stylesheet" href="/levels.css">
  <link rel="stylesheet" href="/style.css">
  <script>${prefs(o.varieties !== undefined)}</script>
</head>
<body${hasNav ? ' class="has-bar"' : ""}>
  <header class="topbar">
    ${breadcrumb(o, t)}
    <div class="tools">${chips({ explain: o.lang, level: o.level, varieties: o.varieties })}${read}${credits(o, false)}${themeButton(t, false)}</div>
  </header>
  <div class="layout${hasNav ? "" : " no-nav"}${filled(o.rail) ? " has-rail" : ""}">
    ${hasNav ? `<nav class="sidebar" id="sidebar">${o.nav}</nav><script>${NAV_SCROLL}</script>` : ""}
    <main class="content">${o.main}</main>
    ${filled(o.rail) ? `<aside class="rail">${o.rail}</aside>` : ""}
  </div>
  ${hasNav ? bottomBar(o, t) : ""}
  ${panels(o, t, hasNav)}
  <script src="/client.js" defer></script>
</body>
</html>
`;
}
