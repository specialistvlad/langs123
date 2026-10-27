// Show more on a track's index: the rows of a list, what each says, the level filter's rules for them, and the lists
// that carry them in both orders.
import { expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { count, loadCurriculum, loadTopics, LEVELS, type Level } from "../../scripts/lib.ts";
import { refRange } from "../../scripts/levels.ts";
import type { Track } from "./context.ts";
import { studyPath } from "./path.ts";
import { moreCss, moreRows, moreSteps } from "./track-more.ts";
import { byCategory, byLevel } from "./track-parts.ts";

const curriculum = await loadCurriculum();
const refs = await loadTopics(curriculum);
const lang = curriculum.languages[0];
if (lang === undefined) throw new Error("the curriculum has no language");
const langRefs = refs.filter((r) => r.lang === lang.code);
const track = { lang, explain: "en", langRefs, path: studyPath(lang, "en", langRefs) } as unknown as Track;
const dom = (html: string): Document => parseHTML(`<div>${html}</div>`).document;
const lowOf = (id: string): Level | undefined => {
  const ref = langRefs.find((r) => r.id === id);
  return ref === undefined ? undefined : refRange(ref, "en")?.from;
};

test("a list's rows name, for each chosen level, the next level with topics above it and how many start there", () => {
  expect(moreSteps(["A0", "A1", "B2", "B2", "C1"])).toEqual([
    { at: ["A0"], next: "A1", n: 1 },
    { at: ["A1", "A2", "B1"], next: "B2", n: 2 },
    { at: ["B2"], next: "C1", n: 1 },
  ]);
  expect(moreSteps([])).toEqual([]);
  expect(moreSteps(["A0"])).toEqual([]);
});

test("a row is a button that sets the next level, with the count and the level's pill", () => {
  const li = dom(moreRows(["A1", "B2", "B2"], "en")).querySelectorAll("li.ix-more")[1];
  expect(li?.getAttribute("data-more")).toBe("A1 A2 B1");
  const button = li?.querySelector("button");
  expect(button?.getAttribute("data-set-level")).toBe("B2");
  expect(button?.querySelector(".ix-more-t")?.textContent).toBe(count("showMore", "en", 2));
  expect(button?.querySelector(".badge.lvl > .half.lvl-B2")?.textContent).toBe("B2");
  expect(moreRows(["A0", "A0"], "en")).toBe("");
});

test("the level filter shows a row at the levels it names and drops the separator the hidden rows before it leave", () => {
  const css = moreCss();
  for (const level of LEVELS) {
    expect(css).toContain(`html[data-level="${level}"] .ix-more[data-more~="${level}"] { display: block; }`);
    expect(css.some((r) => r.startsWith(`html[data-level="${level}"] .ix-sec-more:has(`))).toBe(true);
  }
  expect(css.filter((r) => r.endsWith("::before { display: none; }")).length).toBe(LEVELS.length - 1);
  expect(css.join("\n")).toContain('li:not(.ix-more, :is([data-level="B2"], [data-level="C1"], [data-level="C2"]))');
});

test("a category keeps its card at every level and ends with the Show more rows of its hidden topics", () => {
  const sections = [...dom(byCategory(track)).querySelectorAll("section.ix-sec")];
  expect(sections.length).toBeGreaterThan(0);
  for (const section of sections) {
    expect(section.hasAttribute("data-level")).toBe(false);
    const lows = [...section.querySelectorAll("li[data-level]")].map((li) => li.getAttribute("data-level"));
    const rows = [...section.querySelectorAll("li.ix-more")];
    expect(rows.length).toBe(moreSteps(lows as Level[]).length);
    if (rows.length > 0) expect(section.querySelector("ol")?.lastElementChild?.classList.contains("ix-more")).toBe(true);
  }
});

test("the study path ends with one card of Show more rows for the whole list, counting topics by their lowest level", () => {
  const doc = dom(byLevel(track));
  const ids = new Set(track.path.flatMap((s) => s.steps.map((x) => x.ref.id)));
  const lows = [...ids].flatMap((id) => lowOf(id) ?? []);
  const rows = [...doc.querySelectorAll(".ix-sec-more li.ix-more")];
  expect(rows.map((r) => r.getAttribute("data-more"))).toEqual(moreSteps(lows).map((m) => m.at.join(" ")));
  expect(doc.querySelector("div")?.lastElementChild?.className).toBe("ix-sec-more");
  expect(doc.querySelectorAll("section.ix-sec").length).toBe(track.path.length);
});

test("a topic not written yet is not listed, and a section with none written is left out", () => {
  const written = langRefs.find((r) => r.topic !== null);
  if (written === undefined) throw new Error("the curriculum has no written topic");
  const planned = { ...written, topic: null, entry: { ...written.entry, levels: "A1-B1" } };
  expect(byCategory({ ...track, langRefs: [planned] })).toBe("");
  const html = byCategory({ ...track, langRefs: [planned, written] });
  expect(dom(html).querySelectorAll("li:not(.ix-more)").length).toBe(1);
});

test("a heading ends with the count of its topics, a category's count following the chosen level", () => {
  for (const section of dom(byCategory(track)).querySelectorAll("section.ix-sec")) {
    const n = section.querySelector("h2 > .ix-sec-n");
    const texts = JSON.parse(n?.getAttribute("data-counts") ?? "{}") as Record<string, string>;
    const lows = [...section.querySelectorAll("li[data-level]")].map((li) => li.getAttribute("data-level") ?? "");
    expect(Object.keys(texts)).toEqual([...LEVELS]);
    for (const level of LEVELS) {
      const shown = lows.filter((low) => LEVELS.indexOf(low as Level) <= LEVELS.indexOf(level)).length;
      expect(texts[level]).toBe(count("topics", "en", shown));
    }
    expect(texts[LEVELS.at(-1) ?? ""]).toBe(n?.textContent ?? "");
    expect(section.querySelector("h2")?.lastElementChild).toBe(n ?? null);
  }
  for (const section of dom(byLevel(track)).querySelectorAll("section.ix-sec")) {
    expect(section.querySelector("h2")?.lastElementChild?.textContent).toBe(count("topics", "en", section.querySelectorAll("li").length));
  }
});

test("a topic's row is its title and a chevron with no level mark, the Languages client's tag and the languages it is written in", () => {
  const rows = [...dom(byCategory(track)).querySelectorAll("li:not(.ix-more)")];
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(row.querySelector(".lvm")).toBeNull();
    expect(row.querySelector("a.ix-cover > .ix-name")?.textContent).not.toBe("");
    expect(row.querySelector("[data-xl-tag][hidden] + svg.ix-chev")).not.toBeNull();
    expect(row.getAttribute("data-topic-explains")).not.toBe("");
  }
});

test("the topic the page shows is marked in both groupings, each step it is on the study path included", () => {
  const written = langRefs.filter((r) => r.topic !== null);
  const shown = written[0];
  if (shown === undefined) throw new Error("the curriculum has no written topic");
  const marked = (html: string): number => dom(html).querySelectorAll('li[data-current] > .ix-row > a[aria-current="true"]').length;
  expect(marked(byCategory(track, shown))).toBe(1);
  expect(marked(byCategory(track))).toBe(0);
  const steps = track.path.flatMap((s) => s.steps).filter((s) => s.ref === shown).length;
  expect(marked(byLevel(track, shown))).toBe(steps);
});
