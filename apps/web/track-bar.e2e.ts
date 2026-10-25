// A course index's toolbar and header in a browser: the Level button opens Home's level popover headed by the course
// (under the toolbar's group, on its right edge, on a wide screen; as a sheet on a phone) and names the chosen level
// only; the topic count follows the chosen level; a topic's level popover opens just under its mark.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { LEVELS } from "../../scripts/lib.ts";
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
const panelOpen = (id: string): Promise<boolean> => page.evaluate((p) => document.getElementById(p)?.matches(":popover-open") ?? false, id);
const box = async (selector: string): Promise<{ x: number; y: number; right: number; bottom: number }> => {
  const b = await page.locator(selector).first().boundingBox();
  return { x: b?.x ?? 0, y: b?.y ?? 0, right: (b?.x ?? 0) + (b?.width ?? 0), bottom: (b?.y ?? 0) + (b?.height ?? 0) };
};

test(
  "on a wide screen the Level button opens the course's level popover under the group, on its right edge",
  async () => {
    for (const width of [1032, 1440]) {
      await open(width);
      expect(await page.locator(".ix-level [data-level-label]").textContent()).toBe("All levels");
      await page.click(".ix-level");
      expect(await panelOpen("lv-pop")).toBe(true);
      // The popover takes its place as it opens (client-levels.ts, on its toggle).
      await page.waitForFunction(() => document.getElementById("lv-pop")?.style.top !== "");
      expect(await page.locator("#lv-pop .lv-pop-t").textContent()).toBe("English");
      expect(await page.locator("#lv-pop .lv-pop-note").textContent()).toBe("Content above the chosen level is hidden.");
      const pop = await box("#lv-pop");
      const group = await box(".hm-group");
      expect(Math.round(pop.y - group.bottom)).toBe(8);
      expect(Math.round(pop.right)).toBe(Math.round(group.right));
      // The levels the course does not reach dim; Proficiency (All levels) stays active and ticked.
      const rows = await page.$$eval("#lv-pop .lv-row", (els) =>
        els.map((el) => [el.getAttribute("data-row"), el.classList.contains("lv-off")]),
      );
      expect(rows.map(([level]) => level)).toEqual([...LEVELS]);
      expect(rows.at(-1)).toEqual(["C2", false]);
      expect(await page.locator('#lv-pop [data-row="C2"]').getAttribute("aria-checked")).toBe("true");
      await page.keyboard.press("Escape");
    }
  },
  SLOW,
);

test(
  "choosing a level in the popover names it on the button alone and ticks it, the top row bringing back All levels",
  async () => {
    await open(1440);
    await page.click(".ix-level");
    await page.click('#lv-pop [data-row="B1"]');
    expect(await panelOpen("lv-pop")).toBe(false);
    expect(await page.locator(".ix-level [data-level-label]").textContent()).toBe("Intermediate");
    expect(await page.locator(".ix-level .lvm").count()).toBe(0);
    await page.click(".ix-level");
    expect(await page.locator('#lv-pop [data-row="B1"]').getAttribute("aria-checked")).toBe("true");
    await page.click('#lv-pop [data-row="C2"]');
    expect(await page.locator(".ix-level [data-level-label]").textContent()).toBe("All levels");
  },
  SLOW,
);

test(
  "on a phone the Level button opens the course's sheet from the bottom with a close button",
  async () => {
    await open(402, COURSE, 874);
    await page.click(".ix-level");
    expect(await panelOpen("lv-pop")).toBe(true);
    const sheet = await box("#lv-pop");
    expect([Math.round(sheet.x), Math.round(sheet.right), Math.round(sheet.bottom)]).toEqual([8, 394, 866]);
    expect(await page.locator("#lv-pop .lv-pop-t").textContent()).toBe("English");
    await page.click("#lv-pop .lv-pop-x");
    expect(await panelOpen("lv-pop")).toBe(false);
  },
  SLOW,
);

test(
  "the topic count follows the chosen level: the topics its list shows",
  async () => {
    await open(1440);
    for (const level of LEVELS) {
      await page.click(".ix-level");
      await page.click(`#lv-pop [data-row="${level}"]`);
      const shown = await page.$$eval(
        '.ix-flow[data-order="categories"] .ix-rows > li:not(.ix-more)',
        (rows) => rows.filter((row) => row.getClientRects().length > 0).length,
      );
      expect(Number.parseInt((await page.locator(".ix-count").textContent()) ?? "", 10)).toBe(shown);
    }
  },
  SLOW,
);

test(
  "a topic's level popover opens just under its mark, on the mark's right edge",
  async () => {
    await open(1440);
    await page.locator(".ix-row .lvm-b").first().click();
    expect(await panelOpen("lv-pop")).toBe(true);
    const mark = await box(".ix-row .lvm-b");
    const pop = await box("#lv-pop");
    expect(Math.round(pop.y - mark.bottom)).toBe(8);
    expect(Math.round(pop.right)).toBe(Math.round(mark.right));
  },
  SLOW,
);

test(
  "on a phone the Home button stays while the search field has focus and leaves once a query is typed",
  async () => {
    await open(402, COURSE, 874);
    await page.click("#hm-q");
    expect(await page.locator(".ix-up").isVisible()).toBe(true);
    await page.keyboard.type("past");
    await page.locator(".hm-row").first().waitFor();
    expect(await page.locator(".ix-up").isVisible()).toBe(false);
    await open(1440);
    await page.click("#hm-q");
    await page.keyboard.type("past");
    expect(await page.locator(".ix-up").isVisible()).toBe(true);
  },
  SLOW,
);
