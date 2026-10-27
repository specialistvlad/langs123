// The built pages carry levels the filter can trust: every block's range covers exactly the leaves inside it, so a
// block hides with its last leaf and no table or list is left empty at any level; a section stays, and shows its
// note where the filter hides all of it; every level mark lights the levels of what it labels, and a block's or a
// leaf's shows only where the level changes.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { LEVEL_INFO, LEVELS, lv } from "../../scripts/lib.ts";
import { SAMPLE } from "./sample.ts";
import { readPage, SITE_DIR, testSite } from "./test-site.ts";

const pages = await testSite();
const topicPages = pages.filter((p) => /^[a-z]{2}\/\w+\/[\w-]+\/[\w-]+\/index\.html$/.test(p));
const levelled = (el: Element): Element[] => [...el.querySelectorAll("[data-level]")];
const from = (el: Element): string => el.getAttribute("data-level") ?? "";
const to = (el: Element): string => el.getAttribute("data-to") ?? "";
const label = (a: string, b: string): string => (a === b ? a : `${a}–${b}`);
// The range of some elements: lowest data-level to highest data-to.
function rangeOf(els: Element[]): string {
  const lows = els.map(from).sort((a, b) => lv(a) - lv(b));
  const highs = els.map(to).sort((a, b) => lv(b) - lv(a));
  return label(lows[0] ?? "", highs[0] ?? "");
}
// The levels a mark lights, lowest first.
const lit = (mark: Element | null | undefined): string =>
  mark ? [...mark.querySelectorAll(":scope > i.on")].map((i) => i.className.split(" ")[0]?.slice(3)).join(" ") : "none";
// The leaves of an element: table rows and list items with their level, and a paragraph's block.
const blockLeaves = (blk: Element): Element[] => {
  const inner = [...blk.querySelectorAll("tr[data-level]:not(.gap-row), li[data-level]")];
  return inner.length > 0 ? inner : [blk];
};
const leavesOf = (el: Element): Element[] => [...el.querySelectorAll(".blk")].flatMap(blockLeaves);
// The levels some leaves hold, lowest first, as a mark lights them.
const held = (leaves: Element[]): string => LEVELS.filter((l) => leaves.some((e) => from(e) === l || to(e) === l)).join(" ");

test("every topic of the sample has its page in English", () => {
  expect(topicPages.filter((p) => p.startsWith("en/")).length).toBe(SAMPLE.topics.length);
});

describe.each(topicPages)("%s", (path) => {
  test("every level attribute is on the scale, lowest first", async () => {
    const doc = await readPage(path);
    for (const el of levelled(doc.body)) {
      if (el.matches("[data-set-level]")) continue;
      expect(LEVELS).toContain(from(el) as never);
      expect(lv(to(el))).toBeGreaterThanOrEqual(lv(from(el)));
    }
  });

  test("blocks and sections cover exactly their leaves", async () => {
    const doc = await readPage(path);
    for (const blk of doc.querySelectorAll(".blk")) {
      const leaves = [...blk.querySelectorAll("tr[data-level]:not(.gap-row), li[data-level]")];
      if (leaves.length > 0) expect(`${label(from(blk), to(blk))} ${rangeOf(leaves)}`).toBe(`${rangeOf(leaves)} ${rangeOf(leaves)}`);
    }
    // A section keeps no level of its own, so its heading stays; its note names where its blocks start.
    for (const section of doc.querySelectorAll("section.part")) {
      const blocks = [...section.querySelectorAll(":scope > .blk")];
      expect(blocks.length).toBeGreaterThan(0);
      expect(section.hasAttribute("data-level")).toBe(false);
      expect(section.querySelector(":scope > .filter-empty")?.getAttribute("data-needs")).toBe(rangeOf(blocks).split("–")[0]);
    }
  });

  test("at every level, a visible block has a visible leaf", async () => {
    const doc = await readPage(path);
    // An element shows at a level when it and every element around it with a level start at or below it.
    const shows = (el: Element, level: string): boolean => {
      for (let e: Element | null = el; e && e !== doc.documentElement; e = e.parentElement) if (lv(from(e)) > lv(level)) return false;
      return true;
    };
    for (const level of LEVELS) {
      for (const blk of doc.querySelectorAll(".blk")) {
        if (!shows(blk, level)) continue;
        const leaves = [...blk.querySelectorAll("tbody tr:not(.gap-row), li")];
        if (leaves.length > 0) expect(leaves.some((l) => shows(l, level))).toBe(true);
      }
      // A section whose blocks all hide at a level shows its note there.
      for (const section of doc.querySelectorAll("section.part")) {
        const visible = [...section.querySelectorAll(".blk")].some((b) => shows(b, level));
        const needs = section.querySelector(":scope > .filter-empty")?.getAttribute("data-needs") ?? "";
        expect(visible).toBe(lv(needs) <= lv(level));
      }
    }
  });

  test("marks light the levels they label and show where the level changes", async () => {
    const doc = await readPage(path);
    for (const mark of doc.querySelectorAll(".lvm")) {
      // Seven bars, A0 to C2, in order.
      expect([...mark.querySelectorAll(":scope > i")].map((i) => i.className.split(" ")[0])).toEqual(LEVELS.map((l) => `lv-${l}`));
    }
    for (const section of doc.querySelectorAll("section.part")) {
      expect(lit(section.querySelector(":scope > h2 > .lvm"))).toBe(held(leavesOf(section)));
      const lowest = rangeOf([...section.querySelectorAll(":scope > .blk")]).split("–")[0] ?? "";
      for (const blk of section.querySelectorAll(":scope > .blk")) {
        // A block that starts above its section opens with its mark; a lesson's paragraph carries it inside.
        const own = blk.querySelector(":scope > .blk-level > .lvm") ?? blk.querySelector(":scope > p > .lvm:first-child");
        expect(lit(own)).toBe(lv(from(blk)) > lv(lowest) ? held(blockLeaves(blk)) : "none");
        for (const leaf of blk.querySelectorAll("tr[data-level]:not(.gap-row), li[data-level]")) {
          // A lesson's row shows its level in the Level column; a slot paradigm's, once per tense.
          if (leaf.tagName === "TR") {
            const mark = leaf.querySelector(":scope > td.tp-lvl > .lvm");
            if (mark !== null) expect(lit(mark)).toBe(from(leaf));
            continue;
          }
          const mark = leaf.querySelector(":scope > .tp-li > .lvm:first-child");
          expect(lit(mark)).toBe(lv(from(leaf)) > lv(from(blk)) ? from(leaf) : "none");
        }
      }
    }
  });

  test("the header agrees with the sections", async () => {
    const doc = await readPage(path);
    const sections = [...doc.querySelectorAll("section.part")];
    expect(lit(doc.querySelector(".doc-head .props .lvm"))).toBe(held(sections.flatMap(leavesOf)));
  });
});

test("levels.css hides each level above the filter, dims the badge halves and the bars the bars above it, and gives every level its colours and bar", async () => {
  await testSite();
  const css = await Bun.file(join(SITE_DIR, "levels.css")).text();
  for (const [i, { code }] of LEVEL_INFO.entries()) {
    expect(css).toContain(
      `.lvl-${code} { --lvl: var(--lvl-${code}-ink); --level-tint: var(--lvl-${code}-tint); --level-strong: var(--lvl-${code}-strong); --level-pill: var(--lvl-${code}-pill); --level-pill-ink: var(--lvl-${code}-pill-ink); }`,
    );
    expect(css).toContain(`.lvm > i.lv-${code}.on { background: var(--lvl-${code}-strong); }`);
    const above = LEVELS.slice(i + 1);
    if (above.length === 0) continue;
    expect(css).toContain(`html[data-level="${code}"] .lvm > i:is(${above.map((c) => `.lv-${c}`).join(", ")}).on { opacity: 0.35; }`);
    expect(css).toContain(
      `html[data-level="${code}"]:is([data-page="topic"], [data-page="track"]) :is(${above.map((c) => `[data-level="${c}"]`).join(", ")})`,
    );
    // Badge halves above the filter dim.
    expect(css).toContain(
      `html[data-level="${code}"]:is([data-page="topic"], [data-page="track"]) .lvl > .half:is(${above.map((c) => `.lvl-${c}`).join(", ")}) { opacity: 0.55; }`,
    );
  }
  expect(css).not.toContain(".toc");
});
