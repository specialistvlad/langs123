// A language being learned is built for the explanation languages it lists: its pages exist in those
// alone, name only those as counterparts (with the English one as x-default) and offer only those in the language switch, and its card on
// the home page links those alone. A language with varieties opens on its default variety and offers
// each in a Variety switch; levels.css hides the elements of the varieties not chosen.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { ENABLED_EXPLAIN, type Explain, explainOf, loadCurriculum } from "../../scripts/lib.ts";
import { SAMPLE } from "./sample.ts";
import { readPage, SITE_DIR, testSite } from "./test-site.ts";
import { homeUrl } from "./urls.ts";

const pages = await testSite();
const curriculum = await loadCurriculum();
const spanish = curriculum.languages.find((l) => l.code === "es");
if (!spanish) throw new Error("curriculum.yaml has no Spanish");
const explains = explainOf(spanish);
const spanishPages = pages.filter((p) => p.split("/")[1] === spanish.slug);
const homeFile = (e: Explain): string => `${homeUrl(e).slice(1)}index.html`;

test("a language's pages exist in the explanation languages it lists, and in no other", () => {
  expect(new Set(spanishPages.map((p) => p.split("/")[0]))).toEqual(new Set(explains.filter((e) => SAMPLE.explain.includes(e))));
  expect(spanishPages.length).toBeGreaterThan(0);
});

describe.each(spanishPages)("%s", (path) => {
  test("names its counterparts in its explanation languages alone, and offers those in the language switch", async () => {
    const doc = await readPage(path);
    const links = [...doc.querySelectorAll('link[rel="alternate"]')];
    const alternates = links.map((l) => l.getAttribute("hreflang"));
    expect(alternates).toEqual([...explains, "x-default"]);
    // x-default is the English counterpart.
    const href = (lang: string): string | null | undefined => links.find((l) => l.getAttribute("hreflang") === lang)?.getAttribute("href");
    expect(href("x-default")).toBe(href("en"));
    expect(doc.querySelectorAll(".lang-menu .menu-list a, .hm-read .hm-menu a")).toHaveLength(explains.length);
  });
  test("opens on the default variety and offers each in the Variety switch", async () => {
    const doc = await readPage(path);
    expect(doc.documentElement.getAttribute("data-variety")).toBe(spanish.varieties?.[0] ?? null);
    expect(doc.documentElement.getAttribute("data-varieties")).toBe(spanish.varieties?.join(" ") ?? null);
    // The search's variety filters (hm-f-variety-*) offer each course's varieties; the switch is the rest.
    const switchOnly = [...doc.querySelectorAll("[data-set-variety]")].filter((b) => b.closest('[id^="hm-f-"]') === null);
    const buttons = switchOnly.map((b) => b.getAttribute("data-set-variety"));
    expect(buttons).toEqual(spanish.varieties ?? []);
  });
});

describe.each(ENABLED_EXPLAIN)("the home page in %s", (home) => {
  test("has a card per language that links each explanation language it is written for, the home page's own first", async () => {
    const doc = await readPage(homeFile(home));
    for (const lang of curriculum.languages.filter((l) => l.enabled)) {
      const card = [...doc.querySelectorAll(".hm-card")].find((c) => c.querySelector(`a[href$="/${lang.slug}/"]`) !== null);
      const linked = [...(card?.querySelectorAll(".hm-chip") ?? [])].map((a) => a.getAttribute("hreflang") ?? "");
      const own = explainOf(lang).filter((e) => ENABLED_EXPLAIN.includes(e));
      expect(new Set(linked)).toEqual(new Set(own));
      expect(linked[0]).toBe(own.includes(home) ? home : own[0]);
    }
  });
});

test("a page of a language without varieties has no Variety switch", async () => {
  const doc = await readPage("en/english/verbs/to-be/index.html");
  expect(doc.documentElement.hasAttribute("data-variety")).toBe(false);
  expect(doc.querySelector("[data-set-variety]")).toBeNull();
});

test("levels.css hides, for each chosen variety, the elements of the others, keeping rows and cell copies in the column widths", async () => {
  const css = await Bun.file(join(SITE_DIR, "levels.css")).text();
  for (const chosen of spanish.varieties ?? []) {
    for (const other of (spanish.varieties ?? []).filter((v) => v !== chosen)) {
      const page = `html[data-variety="${chosen}"]`;
      const tag = `:is([data-variety="${other}"])`;
      expect(css).toContain(`${page} ${tag}:not(tr, .cell-variety) { display: none !important; }`);
      expect(css).toContain(`${page} :is(tr, .cell-variety)${tag} { visibility: hidden; overflow: hidden; }`);
      expect(css).toContain(`${page} :is(tr${tag} :is(td, td *), .cell-variety${tag}, .cell-variety${tag} *) { height: 0 !important;`);
    }
  }
});
