// A course index's Group by menu and the counts of its headings in a browser: Group by opens under the head's buttons with
// the grouping in force ticked and By level shows the levels with their counts; a section heading ends with its topic
// count, which follows the chosen level.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Locator, Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
const COURSE = "/en/english/";
let page: Page;
beforeAll(async () => {
  page = await browser.newPage();
}, SLOW);
afterAll(async () => {
  await page.close();
});

async function open(width: number, address = COURSE, height = 900): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto(new URL(address, base).href);
}
const shown = (selector: string): Locator => page.locator(selector).filter({ visible: true }).first();
const box = async (selector: string): Promise<{ x: number; y: number; right: number; bottom: number }> => {
  const b = await shown(selector).boundingBox();
  return { x: b?.x ?? 0, y: b?.y ?? 0, right: (b?.x ?? 0) + (b?.width ?? 0), bottom: (b?.y ?? 0) + (b?.height ?? 0) };
};
const visible = (selector: string): Promise<boolean> =>
  page
    .locator(selector)
    .filter({ visible: true })
    .count()
    .then((n) => n > 0);

test(
  "Group by opens under the head's buttons with the grouping in force ticked; By level shows the levels and their counts",
  async () => {
    await open(1440);
    const tools = await box(".cl-tools");
    await page.click(".cl-tools .ix-group");
    const menu = await box("#ix-groups");
    expect(Math.round(menu.x)).toBe(20);
    expect(menu.y).toBeGreaterThan(tools.bottom);
    expect(await shown("#ix-groups .ix-menu-h").textContent()).toBe("Group by");
    expect(await page.getAttribute('#ix-groups [data-set-order="categories"]', "aria-checked")).toBe("true");
    await page.click('#ix-groups [data-set-order="path"]');
    expect(await page.evaluate(() => document.documentElement.dataset["order"])).toBe("path");
    expect(await visible("#ix-groups")).toBe(false);
    expect(await page.getAttribute('#ix-groups [data-set-order="path"]', "aria-checked")).toBe("true");
    const first = shown('.ix-flow[data-order="path"] .ix-h');
    expect(await first.innerText()).toMatch(/^A0\s+A0 \w+\s+\d+ topics$/);
    expect(await visible('.ix-flow[data-order="categories"]')).toBe(false);
    await page.evaluate(() => {
      localStorage.clear();
    });
  },
  SLOW,
);

test(
  "a section heading ends with its count, which follows the chosen level",
  async () => {
    await open(1440, `${COURSE}?level=a1`);
    const sections = page.locator('.ix-flow[data-order="categories"] .ix-sec:visible');
    const n = await sections.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const section = sections.nth(i);
      const said = Number.parseInt((await section.locator(".ix-sec-n").innerText()).replace(/\D/g, ""), 10);
      expect(said).toBe(await section.locator("li:not(.ix-more):visible").count());
    }
    await page.evaluate(() => {
      localStorage.clear();
    });
  },
  SLOW,
);
