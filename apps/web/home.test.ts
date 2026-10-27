// The Home (pages/home.ts) in each explanation language: one page whatever the width, a header line with the brand, the
// search and More, a card per course with its flag and name, "Up to" and its top level, and the "Explained in" line;
// no split view, level bar, language chips, Read in or "Language references" heading; the More menu (toolbar.ts).
import { describe, expect, test } from "bun:test";
import { ENABLED_EXPLAIN, say, SITE } from "../../scripts/lib.ts";
import { readPage } from "./test-site.ts";
import { ui } from "./ui.ts";
import { creditsUrl, homeUrl, pageUrl } from "./urls.ts";

const home = (e: (typeof ENABLED_EXPLAIN)[number]): Promise<Document> => readPage(`${homeUrl(e).slice(1)}index.html`);

describe.each(ENABLED_EXPLAIN)("the Home in %s", (e) => {
  const t = ui(e);
  test("is one page: a header line, the cards and the results, with no split view", async () => {
    const doc = await home(e);
    expect([...doc.querySelectorAll(".hm-home > *:not(noscript)")].map((el) => el.id || el.className)).toEqual([
      "hm-head",
      "hm-more",
      "hm-main",
    ]);
    expect(doc.querySelectorAll(".sp, .sp-left, .sp-right, .sp-div, [data-sp-item]")).toHaveLength(0);
    expect(doc.querySelector(".hm-main h1.sr-only")?.textContent).toBe(SITE.name);
  });
  test("the header line holds the brand, the search with Close, More and the phone's Search button, in that order", async () => {
    const doc = await home(e);
    expect([...doc.querySelectorAll(".hm-head > *")].map((el) => el.className.split(" ")[0])).toEqual(["hm-brand", "hm-bar"]);
    expect(doc.querySelector(".hm-brand")?.getAttribute("href")).toBe(homeUrl(e));
    expect([...doc.querySelectorAll(".hm-bar > *")].map((el) => el.className.split(" ")[0])).toEqual([
      "hm-mid",
      "hm-group",
      "ix-search-open",
    ]);
    expect([...doc.querySelectorAll(".hm-mid > *")].map((el) => el.id)).toEqual(["hm-form", "hm-close"]);
    expect(doc.querySelectorAll(".hm-more")).toHaveLength(1);
    expect(doc.querySelector(".hm-group .hm-more")?.getAttribute("aria-label")).toBe(t.more);
    expect(doc.querySelector("#hm-q")?.getAttribute("placeholder")).toBe(t.search);
    expect(doc.querySelector(".ix-search-open")?.getAttribute("aria-label")).toBe(t.search);
  });
  test("a card holds its flag and name as the link to the course, its top level and its Explained in line", async () => {
    const doc = await home(e);
    const cards = [...doc.querySelectorAll("#hm-cards > .hm-card")];
    expect(cards.length).toBeGreaterThan(1);
    for (const card of cards) {
      expect(card.hasAttribute("data-xl-card")).toBe(true);
      const link = card.querySelector("a.hm-course-a");
      const code = link?.getAttribute("data-course") ?? "";
      expect(link?.getAttribute("href")).toMatch(/^\/[a-z]{2}\/[a-z-]+\/$/);
      expect(link?.querySelector(".hm-flag")?.textContent).not.toBe("");
      expect(link?.querySelector("h2.hm-name")?.textContent).not.toBe("");
      const upTo = card.querySelector(".hm-upto");
      expect(upTo?.getAttribute("aria-label")).toMatch(new RegExp(`^${say("searchUpTo", e, { level: "[A-C][0-2]" })}$`));
      expect(upTo?.querySelectorAll(".badge .half")).toHaveLength(1);
      const line = card.querySelector("button.xl-line");
      expect([line?.getAttribute("data-course"), line?.querySelector(".xl-text b") === null]).toEqual([code, false]);
      expect(line?.getAttribute("data-explains")).not.toBe("");
    }
  });
  test("a card carries no level bar, language chip or Language references heading", async () => {
    const doc = await home(e);
    expect(doc.querySelectorAll(".hm-card .lvm, .hm-chips, .hm-chip, .hm-label, .hm-title")).toHaveLength(0);
    expect(doc.body.textContent).not.toContain(say("homeHeading", e));
  });
  test("a hidden section after the cards takes the courses none of the reader's languages explains", async () => {
    const doc = await home(e);
    const other = doc.querySelector("#hm-cards + section.xl-other");
    expect(other?.hasAttribute("data-xl-other")).toBe(true);
    expect(other?.hasAttribute("hidden")).toBe(true);
    expect(other?.querySelector("h2")?.textContent).toBe(t.otherExplanationLanguages);
    expect(other?.querySelector("p")?.textContent).toBe(t.otherExplanationNote);
    expect(other?.querySelector("[data-xl-other-cards]")?.className).toBe("hm-grid");
  });
  test("the page has no Read in, theme or credits button and no first-visit redirect", async () => {
    const doc = await home(e);
    expect(doc.querySelectorAll(".hm-read, .hm-theme, .hm-credits, a.hm-page, #hm-themes, #hm-f-read")).toHaveLength(0);
    expect(doc.documentElement.innerHTML).not.toContain("ln-read");
  });
  test("the More menu holds Languages I know with its list, the theme, the credits", async () => {
    const doc = await home(e);
    const items = [...doc.querySelectorAll('#hm-more [data-panel="main"] > .ix-item')];
    expect(items.map((i) => i.querySelector(".ix-title")?.textContent)).toEqual([t.languagesIKnow, t.theme, say("credits", e)]);
    expect(items[0]?.getAttribute("href")).toBe(pageUrl(e, "languages"));
    expect(items[0]?.querySelector(".ix-sub [data-langs-list]")).not.toBeNull();
    expect(items[1]?.getAttribute("data-more")).toBe("theme");
    expect(items[1]?.querySelector("[data-theme-now]")?.textContent).toBe(t.themeAuto);
    expect(items[2]?.getAttribute("href")).toBe(creditsUrl(e));
    const theme = [...doc.querySelectorAll('#hm-more [data-panel="theme"] [data-set-theme]')];
    expect(theme.map((i) => i.getAttribute("data-set-theme"))).toEqual(["auto", "light", "dark"]);
    expect(doc.querySelector('#hm-more [data-panel="theme"] .hm-back')?.getAttribute("data-more")).toBe("main");
  });
  test("the search's filters are the course, the level and, once a course has varieties, the variety", async () => {
    const doc = await home(e);
    const chips = [...doc.querySelectorAll("#hm-filters .hm-fchip")].map((c) => c.getAttribute("data-filter") ?? "variety");
    expect(chips.slice(0, 2)).toEqual(["course", "level"]);
    expect(chips.slice(2).every((c) => c === "variety")).toBe(true);
  });
});
