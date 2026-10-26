// The level filter in a browser: on every topic and track page, each level in the level menu shows exactly what
// starts at or below it, leaves no table or list empty, keeps the contents rows at full strength, keeps every level
// mark's bars and dims the bars above it, each lit bar in its own level's colour, and shows a section's note
// exactly when the filter hides all of the section. A page with varieties shows the default variety's elements
// and those of every variety.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";
import { LEVELS } from "../../scripts/lib.ts";
import { shared } from "./browser.ts";
import { testSite } from "./test-site.ts";

const { base, browser } = await shared();
const pages = (await testSite()).filter((p) => /^en\/\w+\/(index\.html|[\w-]+\/[\w-]+\/index\.html)$/.test(p));
// Pages open side by side, each on a page of its own from a pool of E2E_PAGES (4): Chromium
// renders every page in a process of its own.
const POOL = Number(process.env["E2E_PAGES"] ?? 4);
// A cold browser can take seconds to start, and a check waits for the pages queued before its own.
const SLOW = 30_000;
const idle: Page[] = [];
const waiting: ((page: Page) => void)[] = [];
beforeAll(async () => {
  for (let n = 0; n < POOL; n++) idle.push(await browser.newPage({ viewport: { width: 1600, height: 1000 } }));
  // Every page starts at once, the pool letting as many run as it has pages; a look that fails fails the checks
  // of its page.
  for (const path of pages) seen(path).catch(() => undefined);
}, SLOW);
afterAll(async () => {
  for (const page of idle) await page.close();
});

async function withPage<T>(use: (page: Page) => Promise<T>): Promise<T> {
  const page = idle.pop() ?? (await new Promise<Page>((resolve) => waiting.push(resolve)));
  try {
    return await use(page);
  } finally {
    const next = waiting.shift();
    if (next) next(page);
    else idle.push(page);
  }
}

// What the page shows at a level, measured in the browser.
interface Seen {
  level: string;
  wrongly: string[];
  empty: string[];
  rail: string[];
  marks: string[];
  notes: string[];
}
// Clicks each level's button in turn, in the page, and measures what it shows after each click: the
// click runs the handler a reader's click does, and the handler lays the page out at once.
async function look(page: Page, levels: readonly string[]): Promise<Record<string, Seen>> {
  return page.evaluate((order) => {
    let at = -1;
    // An element starts at its level in the chosen variety where it names one, else at its level.
    const rank = (el: Element): number => {
      const variety = document.documentElement.dataset["variety"];
      const own = variety === undefined ? null : el.getAttribute(`data-level-${variety.toLowerCase()}`);
      return order.indexOf(own ?? el.getAttribute("data-level") ?? "");
    };
    // The order switch shows the lists of one order: by category or along the study path.
    const ordered = (el: Element): boolean =>
      (el.closest("body [data-order]")?.getAttribute("data-order") ?? "categories") ===
      (document.documentElement.dataset["order"] ?? "categories");
    // The variety switch shows the elements of the chosen variety and those of every variety.
    const chosen = document.documentElement.dataset["variety"];
    const other = (e: Element): boolean => chosen !== undefined && (e.getAttribute("data-variety") ?? chosen) !== chosen;
    const fits = (el: Element): boolean => {
      if (!ordered(el)) return false;
      for (let e: Element | null = el; e && e !== document.documentElement; e = e.parentElement) if (rank(e) > at || other(e)) return false;
      return true;
    };
    const visible = (el: Element): boolean => el.checkVisibility({ visibilityProperty: true });
    const name = (el: Element): string =>
      `${el.tagName.toLowerCase()} ${el.getAttribute("data-level") ?? ""} "${el.textContent.slice(0, 40)}"`;
    const measure = (): Seen => {
      const levelled = [...document.querySelectorAll("[data-level]")].filter(
        // What the layout hides at every level (a closed sheet, a slot table's other layout) is not the filter's.
        (el) => el !== document.documentElement && !el.matches("[data-set-level], .toc > li, .toc > li *") && !laidOut.has(el),
      );
      const wrongly = levelled.filter((el) => visible(el) !== fits(el)).map((el) => `${visible(el) ? "shown" : "hidden"}: ${name(el)}`);
      const containers = [...document.querySelectorAll(".blk table, .blk ul")].filter(visible);
      const empty = containers.filter((c) => ![...c.querySelectorAll("tbody tr:not(.gap-row), li")].some(visible)).map(name);
      const rail = [...document.querySelectorAll(".toc > li")].filter((li) => getComputedStyle(li).opacity !== "1").map(name);
      // A lit bar above the filter dims; every lit bar of a mark shows its own level's colour.
      const marks = [...document.querySelectorAll(".lvm:not(.lvm-one)")]
        .filter(visible)
        .filter((m) => {
          const on = [...m.querySelectorAll<HTMLElement>(":scope > i.on")];
          const level = (i: HTMLElement): string => i.className.split(" ")[0]?.slice(3) ?? "";
          const dim = (i: HTMLElement): boolean => getComputedStyle(i).opacity !== "1";
          const colours = on.map((i) => getComputedStyle(i).backgroundColor);
          return on.some((i) => dim(i) !== order.indexOf(level(i)) > at) || new Set(colours).size !== colours.length;
        })
        .map(name);
      // A section shows its note exactly when the filter hides every block in it.
      const notes = [...document.querySelectorAll("section.part")]
        .filter((part) => {
          const note = part.querySelector(":scope > .filter-empty");
          const shown = [...part.querySelectorAll(":scope > .blk")].some(visible);
          return note === null || visible(note) === shown;
        })
        .map(name);
      return { level: order[at] ?? "", wrongly, empty, rail, marks, notes };
    };
    // At the top level the filter hides nothing, so what is hidden then is the layout's.
    const top = document.querySelector(".ix-menu [data-set-level][data-all]");
    if (top instanceof HTMLElement) top.click();
    at = order.length - 1;
    const laidOut = new Set([...document.querySelectorAll("[data-level]")].filter((el) => fits(el) && !visible(el)));
    const out: Record<string, Seen> = {};
    for (const level of order) {
      const button = document.querySelector(`.ix-menu [data-set-level="${level}"]:not([data-all])`);
      if (!(button instanceof HTMLElement)) throw new Error(`no button for ${level}`);
      button.click();
      at = order.indexOf(document.documentElement.dataset["level"] ?? "");
      out[level] = measure();
    }
    return out;
  }, levels);
}

// Each page opens once, and one look measures it at every level.
const seenAt = new Map<string, Promise<Record<string, Seen>>>();
function seen(path: string): Promise<Record<string, Seen>> {
  let known = seenAt.get(path);
  if (known === undefined) {
    known = withPage(async (page) => {
      await page.goto(`${base.href}${path.replace(/index\.html$/, "")}`);
      return look(page, LEVELS);
    });
    seenAt.set(path, known);
  }
  return known;
}

describe.concurrent.each(pages)("%s", (path) => {
  test.concurrent.each([...LEVELS])(
    "at %s",
    async (level) => {
      const at = (await seen(path))[level];
      if (at === undefined) throw new Error(`${path}: no look at ${level}`);
      expect(at.level).toBe(level);
      expect(at.wrongly).toEqual([]);
      expect(at.empty).toEqual([]);
      expect(at.rail).toEqual([]);
      expect(at.marks).toEqual([]);
      expect(at.notes).toEqual([]);
    },
    SLOW,
  );
});
