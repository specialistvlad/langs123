// The study path on the built pages: the track index lists curriculum.yaml's path level by level; every
// step leads to the place its level starts in its topic; a topic holds a row of the study path for each of
// its steps, and Up next follows each step of a topic to the step after it.
import { describe, expect, test } from "bun:test";
import { loadCurriculum, LEVELS, lv } from "../../scripts/lib.ts";
import { SAMPLE } from "./sample.ts";
import { readPage, testSite } from "./test-site.ts";

const pages = await testSite();
const english = (await loadCurriculum()).languages[0];
if (!english) throw new Error("curriculum.yaml has no language");
// The path as the sample site holds it: its levels with the sample's steps.
const path = Object.fromEntries(
  Object.entries(english.path).flatMap(([level, ids]) => {
    const own = ids.filter((id) => SAMPLE.topics.includes(id));
    return own.length > 0 ? [[level, own]] : [];
  }),
);
// The track page holds the index.
const index = await readPage("en/english/index.html");
const steps = [...index.querySelectorAll<HTMLAnchorElement>('.ix-flow[data-order="path"] a.ix-cover')];
// The page a step link opens, and the section its anchor names.
const pageOf = (href: string): string => `${href.split(/[?#]/)[0]?.replace(/^\//, "") ?? ""}index.html`;
const levelOf = (el: Element): string => el.closest("[data-level]")?.getAttribute("data-level") ?? "";
// The address a link opens: its href, with the step its data-path-step names as the reader's click adds it.
const opensOf = (el: Element | null | undefined): string | undefined => {
  const href = el?.getAttribute("href") ?? null;
  const step = el?.getAttribute("data-path-step") ?? null;
  if (href === null || step === null) return href ?? undefined;
  const [base = "", hash] = href.split("#");
  return `${base}?step=${step}${hash === undefined ? "" : `#${hash}`}`;
};

describe("the index", () => {
  test("lists the levels of the path, lowest first, each with its steps", () => {
    const levels = Object.keys(path);
    expect([...index.querySelectorAll('.ix-flow[data-order="path"] .ix-sec')].map(levelOf)).toEqual(levels);
    for (const level of levels) {
      expect(steps.filter((a) => levelOf(a) === level).length).toBe(path[level]?.length ?? 0);
      expect(index.querySelectorAll(`.ix-flow[data-order="path"] li[data-level="${level}"]`).length).toBe(path[level]?.length ?? 0);
    }
    expect(LEVELS.slice(0, levels.length)).toEqual(levels as never);
  });

  test("gives both orders a switch", () => {
    expect(index.querySelectorAll('.ix-seg [data-set-order="categories"], .ix-seg [data-set-order="path"]').length).toBe(2);
  });
});

describe.each(steps.map((a) => [`${levelOf(a)} ${a.getAttribute("href") ?? ""}`, a] as const))("step %s", (_, a) => {
  test("opens its topic where its level starts and names its step", async () => {
    const href = a.getAttribute("href") ?? "";
    expect(href).not.toContain("?");
    expect(a.getAttribute("data-path-step")).toBe(levelOf(a).toLowerCase());
    expect(pages).toContain(pageOf(href));
    const doc = await readPage(pageOf(href));
    const level = levelOf(a);
    const anchor = href.split("#")[1];
    if (anchor === undefined) {
      // The topic's lowest level: the page opens at the top.
      expect(doc.querySelector(".doc-head .props .lvm > i.on")?.className).toBe(`lv-${level} on`);
      return;
    }
    const section = doc.querySelector(`[id="${anchor}"]`);
    if (section === null) throw new Error(`${href}: no section #${anchor}`);
    expect(section.matches("section.part:not(.summary)")).toBe(true);
    expect(section.querySelector(`[data-level="${level}"]`) !== null || levelOf(section) === level).toBe(true);
    // No earlier section holds the level.
    const earlier = [...doc.querySelectorAll("section.part:not(.summary)")];
    for (const part of earlier.slice(0, earlier.indexOf(section))) {
      expect(part.querySelector(`[data-level="${level}"]`) === null && levelOf(part) !== level).toBe(true);
    }
  });
});

describe("a topic page", () => {
  const all = steps.map((a) => ({ level: levelOf(a), href: opensOf(a) ?? "" }));
  const topicsOnPath = [...new Set(all.map((s) => pageOf(s.href)))];
  const written = [...index.querySelectorAll('.ix-flow[data-order="categories"] li[data-level]')].flatMap((li) => {
    const href = li.querySelector("a")?.getAttribute("href");
    return href !== null && href !== undefined ? [{ level: levelOf(li), href }] : [];
  });

  interface Lead {
    next: string | undefined;
    restart: boolean;
  }
  // Where a page at position i leads at a level of the filter: the shown page after it, and from the
  // last shown page back to the first.
  function expected(list: { level: string; href: string }[], i: number, level: string): Lead {
    const shown = (e: { level: string }): boolean => lv(e.level) <= lv(level);
    const after = list.slice(i + 1).find(shown);
    const first = list.find(shown);
    const restart = after === undefined && first !== undefined && first !== list[i];
    return { next: after?.href ?? (restart ? first.href : undefined), restart };
  }
  // Up next of a page for one grouping (and one step) at a level: where it leads, and whether it starts over.
  function seen(doc: Document, rows: string, level: string): { next: string | undefined; restart: boolean } {
    const found = doc.querySelectorAll(`.tp-end .up-next${rows}[data-at~="${level}"]`);
    expect(found.length).toBeLessThanOrEqual(1);
    return {
      next: opensOf(found[0]?.querySelector("a.next")),
      restart: found[0]?.querySelector(".tp-caps")?.textContent === "Start over",
    };
  }

  test.each(topicsOnPath)(
    "%s holds a row for each of its steps; at every level each step's Up next leads to the shown step after it",
    async (file) => {
      const doc = await readPage(file);
      const own = all.flatMap((s, i) => (pageOf(s.href) === file ? [{ ...s, i }] : []));
      expect([...doc.querySelectorAll(".tp-path-row")].map(levelOf)).toEqual(own.map((s) => s.level));
      for (const s of own) {
        for (const level of LEVELS) {
          const want = expected(all, s.i, level);
          expect(seen(doc, `[data-order="path"][data-step="${s.level}"]`, level)).toEqual({ next: want.next, restart: want.restart });
        }
      }
    },
  );

  test.each(written.map((w, i) => [w.href, i] as const))(
    "%s, by category, leads at every level to the shown topic after it",
    async (href, i) => {
      const doc = await readPage(pageOf(href));
      for (const level of LEVELS) {
        const want = expected(written, i, level);
        expect(seen(doc, '[data-order="categories"]', level)).toEqual({ next: want.next, restart: want.restart });
      }
    },
  );
});
