// The languages page and the data beside it, in every explanation language (pages/languages.ts, languages-data.ts).
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { ENABLED_EXPLAIN, explainName, type Explain, say } from "../../scripts/lib.ts";
import { readPage, SITE_DIR, testSite } from "./test-site.ts";
import { homeUrl, languagesDataUrl, languagesFirstUrl, languagesUrl } from "./urls.ts";

await testSite();
const rel = (url: string): string => `${url.replace(/^\//, "")}index.html`;
const codes = (list: Element | null): (string | null)[] =>
  [...(list?.querySelectorAll(".ml-row") ?? [])].map((r) => r.getAttribute("data-lang"));

describe.each(ENABLED_EXPLAIN)("in %s", (e: Explain) => {
  test("the page holds its language on the list and every other under Add, Home beside the title", async () => {
    const doc = await readPage(rel(languagesUrl(e)));
    expect(doc.documentElement.getAttribute("lang")).toBe(e);
    expect(doc.querySelector("h1")?.textContent).toBe(say("languagesIKnow", e));
    expect(doc.querySelector(".cr-head a.pg-up")?.getAttribute("href")).toBe(homeUrl(e));
    expect(doc.querySelector(".ml-intro")?.textContent).toBe(say("languagesNote", e));
    expect(doc.querySelector(".ml-hint")?.textContent).toBe(say("languagesLimit", e));
    expect(doc.querySelector(".ml-label")?.textContent).toBe(say("addLanguage", e));
    expect(codes(doc.querySelector("[data-ml-ranked]"))).toEqual([e]);
    expect(codes(doc.querySelector("[data-ml-others]"))).toEqual(ENABLED_EXPLAIN.filter((c) => c !== e));
    expect(doc.querySelector("[data-ml-continue]")).toBeNull();
    expect(doc.querySelector("main")?.hasAttribute("data-first")).toBe(false);
  });

  test("a row names the language as it is written and in the page's language, with its three controls", async () => {
    const doc = await readPage(rel(languagesUrl(e)));
    const row = doc.querySelector(`.ml-row[data-lang="${e}"]`);
    expect(row?.querySelector(".ml-name span")?.textContent).toBe(explainName(e));
    expect(row?.querySelector(".ml-rank")?.textContent).toBe("1");
    expect(row?.querySelector(".ml-rank")?.classList.contains("ml-1")).toBe(true);
    expect(row?.getAttribute("data-home")).toBe(homeUrl(e));
    expect(row?.querySelector(".ml-grip")?.getAttribute("aria-label")).toBe(
      say("labelled", e, { label: say("reorder", e), value: explainName(e) }),
    );
    expect(row?.querySelector(".ml-remove")?.getAttribute("aria-label")).toBe(
      say("labelled", e, { label: say("remove", e), value: explainName(e) }),
    );
    const other = ENABLED_EXPLAIN.find((c) => c !== e) ?? e;
    expect(doc.querySelector(`.ml-row[data-lang="${other}"] .ml-add`)?.getAttribute("aria-label")).toBe(
      say("labelled", e, { label: say("add", e), value: explainName(other) }),
    );
    expect(doc.querySelector(`.ml-row[data-lang="${other}"] .ml-rank`)?.textContent).toBe("");
  });

  test("the first-run form has the product's mark, the intro and Continue, and stays out of the sitemap", async () => {
    const doc = await readPage(rel(languagesFirstUrl(e)));
    expect(doc.querySelector(".ml-page")?.hasAttribute("data-first")).toBe(true);
    expect(doc.querySelector(".cr-head .ml-mark svg")).not.toBeNull();
    expect(doc.querySelector(".cr-head a.pg-up")).toBeNull();
    expect(doc.querySelector(".ml-intro")?.textContent).toBe(say("languagesIntro", e));
    expect(doc.querySelector("[data-ml-continue]")?.textContent).toBe(say("continue", e));
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    const sitemap = await Bun.file(join(SITE_DIR, "sitemap.xml")).text();
    expect(sitemap).toContain(`${languagesUrl(e)}</loc>`);
    expect(sitemap).not.toContain(languagesFirstUrl(e));
  });

  test("the data names every language, the courses and the wording of the lines and the sheet", async () => {
    const data = (await Bun.file(join(SITE_DIR, languagesDataUrl(e))).json()) as {
      lang: string;
      languages: { code: string; own: string; named: string; home: string; page: string; firstRun: string }[];
      courses: Record<string, { flag: string; name: string }>;
      words: Record<string, string>;
    };
    expect(data.lang).toBe(e);
    expect(data.languages.map((l) => l.code)).toEqual(ENABLED_EXPLAIN);
    const self = data.languages.find((l) => l.code === e);
    expect(self).toMatchObject({
      own: explainName(e),
      named: explainName(e),
      home: homeUrl(e),
      page: languagesUrl(e),
      firstRun: languagesFirstUrl(e),
    });
    expect(Object.keys(data.courses).length).toBeGreaterThan(0);
    expect(data.words["courseExplainedIn"]).toContain("{language");
    expect(data.words["topicFallback"]).toContain("{fallback");
    expect(data.words["nowLanguage"]).toContain("{language");
    expect(data.words["courseLabel"]).toContain("{course");
    expect(data.words["nowLanguageMissing"]).toContain("{first");
    expect(data.words["close"]).toBe(say("close", e));
    expect(data.words["editLanguagesIKnow"]).toBe(say("editLanguagesIKnow", e));
  });
});

test("the first language's pages sit at the root, the others under their code", () => {
  expect(languagesUrl(ENABLED_EXPLAIN[0] ?? "en")).toBe("/languages/");
  expect(languagesFirstUrl("uk")).toBe("/uk/languages/first/");
  expect(languagesDataUrl("uk")).toBe("/uk/languages.json");
});
