// Show more in the course index, in a browser: at every level each list shows the topics that start at or below it and,
// when it hides some, one Show more row naming the next level that has hidden topics and how many start there (on the
// study path one row for the whole list); the first row shown has no separator over it; a tap moves the level filter
// up to the row's level until nothing is hidden.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { LEVELS } from "../../scripts/lib.ts";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});
const open = (address: string): Promise<unknown> => page.goto(new URL(address, base).href);
// Chooses a grouping in the Group by menu of the course's head.
async function chooseOrder(order: string): Promise<void> {
  await page.locator(".ix-group").filter({ visible: true }).first().click();
  await page.click(`#ix-groups [data-set-order="${order}"]`);
}

// What the lists of the order shown hold at the level chosen, measured in the browser: each problem as a sentence.
function check(order: string, levels: readonly string[]): Promise<string[]> {
  return page.evaluate(
    ({ order: chosen, levels: scale }) => {
      const problems: string[] = [];
      const root = document.documentElement;
      const rank = (level: string): number => scale.indexOf(level);
      const visible = (el: Element): boolean => el.checkVisibility();
      const topic = (li: Element): string => (li.querySelector("a")?.getAttribute("href") ?? "").split("#")[0] ?? "";
      // A topic's lowest level is its row's in the categories (a step on the study path carries its level's).
      const startOf = new Map(
        [...document.querySelectorAll('.ix-flow[data-order="categories"] li[data-level]')].map((li) => [
          topic(li),
          li.getAttribute("data-level") ?? "",
        ]),
      );
      const lowest = (li: Element): string => startOf.get(topic(li)) ?? "";
      const lists = [...document.querySelectorAll(`.ix-flow[data-order="${chosen}"] ol.ix-rows`)];
      const topics = (ol: Element): Element[] => [...ol.children].filter((li) => !li.matches(".ix-more"));
      // Expected from the topics that belong to the Show more row of `ols`, hidden above `at`.
      const expectMore = (own: Element[], at: number): { next: string; n: number } | null => {
        const lows = new Map(own.map((li) => [topic(li), lowest(li)]));
        const hidden = [...lows.values()].filter((l) => rank(l) > at);
        if (hidden.length === 0) return null;
        const next = scale[Math.min(...hidden.map(rank))] ?? "";
        return { next, n: hidden.filter((l) => l === next).length };
      };
      for (const level of scale) {
        document.querySelector<HTMLElement>(`.ix-menu [data-set-level="${level}"]:not([data-all])`)?.click();
        const at = rank(root.dataset["level"] ?? "");
        const all = lists.flatMap(topics);
        for (const ol of lists) {
          const rows = topics(ol);
          const label = `${chosen} ${level} "${ol.parentElement?.querySelector("h2")?.textContent ?? ""}"`;
          const shown = rows.filter(visible);
          if (shown.length !== rows.filter((li) => rank(li.getAttribute("data-level") ?? "") <= at).length) {
            problems.push(`${label}: topics`);
          }
          // The row sits in its own list on the study path (it has no topics) and ends each list of categories.
          const own = chosen === "path" ? (rows.length === 0 ? all : []) : rows;
          const want = own.length === 0 ? null : expectMore(own, at);
          const more = [...ol.querySelectorAll(":scope > .ix-more")].filter(visible);
          const [row] = more;
          if (more.length !== (want === null ? 0 : 1)) problems.push(`${label}: ${more.length} rows`);
          else if (row !== undefined && want !== null) {
            const button = row.querySelector("button");
            const text = row.querySelector(".ix-more-t")?.textContent ?? "";
            if (button?.getAttribute("data-set-level") !== want.next) {
              problems.push(`${label}: sets ${button?.getAttribute("data-set-level") ?? ""}`);
            }
            if (!text.includes(`(${want.n})`)) problems.push(`${label}: says "${text}", wants ${want.n}`);
            if (row.querySelector(".half")?.textContent !== want.next) problems.push(`${label}: pill`);
            if (ol.lastElementChild !== row && !(ol.lastElementChild instanceof Element && !visible(ol.lastElementChild))) {
              problems.push(`${label}: not last`);
            }
          }
          // Only a row with a visible row before it has a separator over it.
          [...ol.children].filter(visible).forEach((li, i) => {
            const rule = getComputedStyle(li, "::before");
            const line = rule.position === "absolute" && rule.display !== "none";
            if (line !== i > 0) problems.push(`${label}: separator ${i}`);
          });
        }
      }
      return problems;
    },
    { order, levels },
  );
}

for (const order of ["categories", "path"]) {
  test(
    `the lists of the ${order} order show their topics and one Show more row at every level`,
    async () => {
      await open(`/en/english/?level=a0`);
      await chooseOrder(order);
      expect(await check(order, LEVELS)).toEqual([]);
    },
    SLOW,
  );
}

test(
  "a tap on Show more sets the level filter to the row's level, and the rows leave when nothing is hidden",
  async () => {
    await open("/en/english/?level=a0");
    await chooseOrder("categories");
    const rows = page.locator(".ix-flow[data-order='categories'] .ix-more:visible");
    let level = await page.evaluate(() => document.documentElement.dataset["level"] ?? "");
    for (let taps = 0; (await rows.count()) > 0; taps++) {
      expect(taps).toBeLessThan(LEVELS.length);
      const next = (await rows.first().locator("button").getAttribute("data-set-level")) ?? "";
      expect(LEVELS.indexOf(next as never)).toBeGreaterThan(LEVELS.indexOf(level as never));
      await rows.first().click();
      level = await page.evaluate(() => document.documentElement.dataset["level"] ?? "");
      expect(level).toBe(next);
      expect(new URL(page.url()).searchParams.get("level")).toBe(next.toLowerCase());
    }
    expect(
      await page
        .locator(".ix-flow[data-order='categories'] li:not(.ix-more)")
        .evaluateAll((els) => els.every((el) => el.checkVisibility())),
    ).toBe(true);
  },
  SLOW,
);
