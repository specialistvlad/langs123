// A language being learned is built for the explanation languages it lists: its pages exist in those
// alone, name only those as counterparts and offer only those in the language switch, and the home
// matrix leaves the other cells empty. A language with varieties opens on its default variety and offers
// each in a Variety switch; levels.css hides the elements of the varieties not chosen.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { ENABLED_EXPLAIN, type Explain, explainOf, loadCurriculum } from "../../scripts/lib.ts";
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
  expect(new Set(spanishPages.map((p) => p.split("/")[0]))).toEqual(new Set(explains));
  expect(spanishPages.length).toBeGreaterThan(0);
});

describe.each(spanishPages)("%s", (path) => {
  test("names its counterparts in its explanation languages alone, and offers those in the language switch", async () => {
    const doc = await readPage(path);
    const alternates = [...doc.querySelectorAll('link[rel="alternate"]')].map((l) => l.getAttribute("hreflang"));
    expect(alternates).toEqual(explains);
    expect(doc.querySelectorAll(".lang-menu .menu-list a")).toHaveLength(explains.length);
  });
  test("opens on the default variety and offers each in the Variety switch", async () => {
    const doc = await readPage(path);
    expect(doc.documentElement.getAttribute("data-variety")).toBe(spanish.varieties?.[0] ?? null);
    expect(doc.documentElement.getAttribute("data-varieties")).toBe(spanish.varieties?.join(" ") ?? null);
    const buttons = [...doc.querySelectorAll("[data-set-variety]")].map((b) => b.getAttribute("data-set-variety"));
    expect(buttons).toEqual(spanish.varieties ?? []);
  });
});

describe.each(ENABLED_EXPLAIN)("the home page in %s", (home) => {
  test("leads into each track of every language, and leaves a cell empty where a language is not explained", async () => {
    const doc = await readPage(homeFile(home));
    const columns = [...doc.querySelectorAll(".matrix thead th[lang]")].map((th) => th.getAttribute("lang") ?? "");
    for (const lang of curriculum.languages.filter((l) => l.enabled)) {
      const row = [...doc.querySelectorAll(".matrix tbody tr")].find((tr) => tr.querySelector(`a[href$="/${lang.slug}/"]`) !== null);
      const cells = [...(row?.querySelectorAll("td") ?? [])];
      const own = explainOf(lang);
      expect(cells.map((td) => td.querySelector("a")?.getAttribute("hreflang") ?? null)).toEqual(
        columns.map((e) => ((own as string[]).includes(e) ? e : null)),
      );
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
