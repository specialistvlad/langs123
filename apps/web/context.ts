// What every page builder shares: build options, curriculum data, links and the page list.
import { type CurriculumLanguage, ENABLED_EXPLAIN, type Explain, explainName, explainOf, type TopicRef } from "../../scripts/lib.ts";
import type { Range } from "../../scripts/levels.ts";
import type { Choice } from "./chrome.ts";
import type { Sample } from "./sample.ts";
import type { PageInput, PageKind } from "./layout.ts";
import type { Ui } from "./ui.ts";
import type { Stage } from "./path.ts";
import type { LinkFn } from "./html.ts";

export interface BuildOptions {
  outDir: string;
  dev: boolean;
  siteUrl: string;
  // Umami analytics: the website to report to and the script that reports.
  umami?: { websiteId: string; src: string };
  // Builds only these topics and their tracks in these explanation languages (sample.ts); home, credits and
  // the missing page in every explanation language.
  sample?: Sample;
  // Each page's head, changed from what the page is: build() calls it once per page with the page's facts.
  head?: (page: PageFacts) => HeadChange;
}

// What a built page is. build() returns these for every page, in the order it builds them.
export interface PageFacts {
  path: string;
  kind: PageKind;
  // The page's language: the explanation language it is written in.
  explain: Explain;
  title: string;
  description: string;
  // The same page in each explanation language, x-default last when the page has one.
  alternates: { lang: string; path: string }[];
  // The page belongs in the sitemap.
  sitemap: boolean;
  // The page's own name: a topic's, a track's or a cheatsheet's title, without the site or the track.
  name?: string;
  // On a track's pages: the code of the language being learned.
  lang?: string;
  // On a topic page and a topic's cheatsheet: the topic's id, and the title of its section.
  topic?: string;
  section?: string;
  // On a cheatsheet: the group it belongs to.
  sheet?: "levels" | "progressive" | "sections" | "topics";
  // The levels the page spans.
  range?: Range;
  // On a topic page: the minutes the full lesson takes to read.
  minutes?: number;
}

// A change to a page's head. The title and description also set Open Graph's; canonical names the page
// search engines take as the original, by path; alternates: false leaves out the hreflang links; type is
// the Open Graph type; tags go at the end of the head as they are.
export interface HeadChange {
  title?: string;
  description?: string;
  canonical?: string;
  alternates?: boolean;
  type?: string;
  tags?: string[];
}

export interface Page {
  path: string;
  html: string;
  sitemap: boolean;
}

export interface Context {
  o: BuildOptions;
  refs: TopicRef[];
  link: LinkFn;
  // Languages being learned that readers see.
  languages: CurriculumLanguage[];
  // A page, rendered with the build's options; sitemap: false keeps it out of the sitemap.
  add: (page: PageInput, sitemap?: boolean) => void;
  // A file other than a page, written as it is.
  file: (path: string, text: string) => void;
}

// One track: a language being learned, explained in one explanation language.
export interface Track {
  ctx: Context;
  lang: CurriculumLanguage;
  explain: Explain;
  // The explanation languages readers see the language in: its counterparts of this track.
  explains: Explain[];
  t: Ui;
  title: string;
  langRefs: TopicRef[];
  written: TopicRef[];
  // The study path: per level, the steps to study.
  path: Stage[];
}

export const EXPLAINS = ENABLED_EXPLAIN;

// The explanation languages readers see a language being learned in: those it is written for, enabled.
export const explainsOf = (lang: CurriculumLanguage): Explain[] => explainOf(lang).filter((e) => EXPLAINS.includes(e));

// The home page and the missing page speak the first enabled explanation language.
export function homeLanguage(): Explain {
  const [home] = EXPLAINS;
  if (home === undefined) throw new Error("site.yaml enables no explanation language");
  return home;
}

// The choice whose link leads to this page is on; a track's pages offer the languages it is explained in.
export function readChoices(explain: Explain, pathFor: (e: Explain) => string, langs: readonly Explain[] = EXPLAINS): Choice[] {
  const here = pathFor(explain);
  return langs.map((e) => ({ label: explainName(e), href: pathFor(e), on: pathFor(e) === here }));
}
export const alternates = (pathFor: (e: Explain) => string, langs: readonly Explain[] = EXPLAINS): { lang: Explain; path: string }[] =>
  langs.map((e) => ({ lang: e, path: pathFor(e) }));
