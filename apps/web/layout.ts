// The page shell: the head, the page's own body drawn in the frame (frame.css), and the script that runs before first paint.
import { type Explain, LEVELS, type Variety } from "../../scripts/lib.ts";
import type { Choice, HeadChange, PageFacts } from "./context.ts";
import { escapeHtml } from "./html.ts";

export type PageKind = "home" | "track" | "topic" | "credits" | "404";

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
  // The page's body, drawn edge to edge in the frame of frame.css.
  body: string;
  // Tags of the page's own at the end of its head.
  headTags?: string[];
  // What the page is about, for its facts (context.ts PageFacts).
  about?: Pick<PageFacts, "name" | "lang" | "topic" | "section" | "range" | "minutes">;
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
const PREFS = `var d=document.documentElement,p=new URLSearchParams(location.search),s=localStorage,l=(p.get("level")||"").toUpperCase();if(${JSON.stringify(LEVELS)}.indexOf(l)>=0)s.setItem("ln-level",l);d.dataset.level=s.getItem("ln-level")||"${LEVELS.at(-1) ?? ""}";d.dataset.order=s.getItem("ln-order")==="path"?"path":"categories";var t=s.getItem("ln-theme");if(t&&t!=="auto")d.dataset.theme=t;if(!CSS.supports("display","grid-lanes"))d.dataset.lanes="wait"`;
// A page with varieties keeps the reader's choice per language being learned, ln-variety-es; the address
// (?variety=es-es) wins, and the page opens on the default it names.
const VARIETY_PREFS = `;var vs=d.dataset.varieties.split(" "),f=function(x){return vs.filter(function(y){return y.toLowerCase()===x.toLowerCase()})[0]},k="ln-variety-"+vs[0].split("-")[0],a=f(p.get("variety")||"");if(a)s.setItem(k,a);a=f(s.getItem(k)||"");if(a)d.dataset.variety=a`;
const prefs = (varieties: boolean): string => `try{${PREFS}${varieties ? VARIETY_PREFS : ""}}catch(e){}`;

// The default variety on the page, and the ones the reader chooses between.
const varietyAttrs = (varieties: Variety[] | undefined): string =>
  varieties === undefined ? "" : ` data-variety="${varieties[0] ?? ""}" data-varieties="${varieties.join(" ")}"`;

// change: the build's head option's change to this page (context.ts HeadChange).
export function page(o: PageOptions, change: HeadChange = {}): string {
  const url = (path: string): string => `${o.siteUrl}${path}`;
  const title = change.title ?? o.title;
  const description = change.description ?? o.description;
  const canonical = url(change.canonical ?? o.path);
  const alternates = (change.alternates === false ? [] : alternatesOf(o))
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${url(a.path)}">`)
    .join("\n  ");
  return `<!doctype html>
<html lang="${o.lang}" data-page="${o.kind}" data-dev="${o.dev ? 1 : 0}" data-frame${varietyAttrs(o.varieties)}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
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
  <script>${prefs(o.varieties !== undefined)}</script>${[...(o.headTags ?? []), ...(change.tags ?? [])].map((tag) => `\n  ${tag}`).join("")}
</head>
<body>
  ${o.body}
  <script src="/client.js" defer></script>
</body>
</html>
`;
}
