// Static site build: every page of every track rendered to HTML, plus the sitemap.
// Run: npm run build   (SITE_URL sets the public URL for canonical links and the sitemap; the site is served from the domain root)
//      npm run build -- --design <name>   builds it in that design (tokens.ts)
//      npm run build -- --library v1 [--root <folder>]   writes the new library's pages and its export beside today's
//                                                       pages, from library/ or the folder (BuildOptions.library)
import { join, resolve } from "node:path";
import { type CurriculumLanguage, loadCurriculum, loadTopics, localize, ROOT, type TopicRef } from "../../scripts/lib.ts";
import { type BuildOptions, type Context, explainsOf, type Page, type PageFacts } from "./context.ts";
import { page, pageFacts } from "./layout.ts";
import { studyPath } from "./path.ts";
import { ui } from "./ui.ts";
import { writeSite } from "./output.ts";
import { brandPages, checkBrandPages } from "./pages/brand-pages.ts";
import { creditsPage } from "./pages/credits.ts";
import { homePage } from "./pages/home.ts";
import { languagesPage } from "./pages/languages.ts";
import { notFoundPage } from "./pages/notfound.ts";
import { topicPages } from "./pages/topic.ts";
import type { LinkFn } from "./html.ts";
import { trackIndex } from "./pages/track.ts";
import { topicUrl } from "./urls.ts";
import { designArg } from "./tokens.ts";
import { exportV1, type LibraryV1 } from "../../scripts/v1/export/library.ts";
import { readingPages } from "./pages/reading.ts";

export type { BuildOptions, HeadChange, PageFacts } from "./context.ts";

// Where the new library's export stands in the built site: library.json and one file per course.
export const V1_DATA = "data/v1";

// The library a command line names, --library today or --library v1, and today's without it.
export function libraryArg(args: readonly string[]): "today" | "v1" {
  const at = args.indexOf("--library");
  const library = at < 0 ? "today" : args[at + 1];
  if (library !== "today" && library !== "v1") throw new Error(`--library takes today or v1, not ${library ?? "nothing"}`);
  return library;
}

// The new library's root a command line names, --root <folder> from core's root (library/samples for the samples).
export function rootArg(args: readonly string[]): string | undefined {
  const at = args.indexOf("--root");
  if (at < 0) return undefined;
  const folder = args[at + 1];
  if (folder === undefined || folder.startsWith("--")) throw new Error("--root takes a folder");
  return resolve(ROOT, folder);
}

// The new library's export, for a build of library "v1": the approved topics, and every draft too in dev (RV-03).
function readV1(o: BuildOptions): Promise<LibraryV1> {
  return exportV1({
    library: "v1",
    drafts: o.dev,
    ...(o.root !== undefined && { root: o.root }),
    ...(o.design !== undefined && { design: o.design }),
  });
}

// The export as the build writes it beside the pages, by path.
const v1Data = (v1: LibraryV1): [string, string][] => [
  [`${V1_DATA}/library.json`, JSON.stringify(v1.library)],
  ...v1.courses.map((c): [string, string] => [`${V1_DATA}/${c.course}.json`, JSON.stringify(c)]),
];

// Builds the site into o.outDir and returns the facts of every page it holds.
export async function build(o: BuildOptions): Promise<PageFacts[]> {
  checkBrandPages(o.brand?.pages);
  const v1 = o.library === "v1" ? await readV1(o) : undefined;
  const curriculum = await loadCurriculum();
  const all = await loadTopics(curriculum);
  const refs = o.sample === undefined ? all : all.filter((r) => o.sample?.topics.includes(r.id) === true);
  const langs = new Map<string, CurriculumLanguage>(curriculum.languages.map((l) => [l.code, l]));
  const langOf = (ref: TopicRef): CurriculumLanguage => {
    const lang = langs.get(ref.lang);
    if (lang === undefined) throw new Error(`${ref.id}: language "${ref.lang}" is not in curriculum.yaml`);
    return lang;
  };
  // Readers see enabled languages only, in the explanation languages each is written for; links elsewhere
  // stay plain text.
  const link: LinkFn = (target, explain) =>
    target?.topic && langOf(target).enabled && explainsOf(langOf(target)).includes(explain)
      ? topicUrl(explain, langOf(target), target)
      : null;
  const pages: Page[] = [];
  const facts: PageFacts[] = [];
  const ctx: Context = {
    o,
    refs,
    link,
    languages: curriculum.languages.filter((l) => l.enabled && refs.some((r) => r.lang === l.code)),
    add: (input, sitemap = true) => {
      const about = pageFacts(input, sitemap);
      facts.push(about);
      pages.push({ path: input.path, html: page({ ...input, dev: o.dev, siteUrl: o.siteUrl }, o.head?.(about)), sitemap });
    },
    file: (path, text) => {
      pages.push({ path, html: text, sitemap: false });
    },
  };

  homePage(ctx);
  creditsPage(ctx);
  brandPages(ctx);
  languagesPage(ctx);
  for (const lang of ctx.languages) {
    const langRefs = refs.filter((r) => r.lang === lang.code);
    const written = langRefs.filter((r) => r.topic);
    const explains = explainsOf(lang);
    for (const explain of explains.filter((e) => o.sample === undefined || o.sample.explain.includes(e))) {
      const t = ui(explain);
      const path = studyPath(lang, explain, langRefs);
      const track = { ctx, lang, explain, explains, t, title: t.track(localize(lang.name, explain)), langRefs, written, path };
      trackIndex(track);
      topicPages(track);
      if (v1 !== undefined) readingPages(track, v1);
    }
  }
  notFoundPage(ctx);

  await writeSite(
    pages,
    o,
    ctx.languages.flatMap((l) => (l.varieties === undefined ? [] : [l.varieties])),
    v1 === undefined ? [] : v1Data(v1),
  );
  return facts;
}

if (import.meta.main) {
  const siteUrl = (process.env["SITE_URL"] ?? "http://127.0.0.1:47380").replace(/\/$/, "");
  const args = process.argv.slice(2);
  const root = rootArg(args);
  const options = { design: designArg(args), library: libraryArg(args), ...(root !== undefined && { root }) };
  const count = (await build({ outDir: join(ROOT, "build/web"), dev: false, siteUrl, ...options })).length;
  console.log(`built ${count} pages into build/web/ for ${siteUrl}`);
}
