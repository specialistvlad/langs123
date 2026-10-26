// A course index's layout in a browser. A wide screen is the split view: the left pane's title row holds the Home
// button, the list button and the course, the field under it, then the order switch with the topic count; the group is
// the right pane's tools at its top right; a query puts the filters under the field; the topic open in the right pane
// is marked in the list. A phone: the Home button, the course and the count share the title row, the Search button at
// the bar's right end opens the field and Close closes it.
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
// The first of the elements that are shown: the group is in the phone's bar and in the right pane's tools.
const shown = (selector: string): Locator => page.locator(selector).filter({ visible: true }).first();
const box = async (selector: string): Promise<{ x: number; y: number; right: number; bottom: number }> => {
  const b = await shown(selector).boundingBox();
  return { x: b?.x ?? 0, y: b?.y ?? 0, right: (b?.x ?? 0) + (b?.width ?? 0), bottom: (b?.y ?? 0) + (b?.height ?? 0) };
};

// The left pane has taken the width its state gives it (it eases there).
const leftWidth = (width: number): Promise<unknown> =>
  page.waitForFunction((w) => Math.round(document.querySelector(".sp-left")?.getBoundingClientRect().width ?? 0) === w, width);
const middle = (b: { y: number; bottom: number }): number => Math.round((b.y + b.bottom) / 2);

test(
  "on a wide screen the title row holds Home, the list button and the course; the field, then the switch and the count",
  async () => {
    for (const width of [1032, 1440]) {
      await open(width);
      const home = await box(".ix-up");
      const list = await box(".sp-list");
      const title = await box(".ix-flag");
      expect([home.x, home.y, home.bottom - home.y]).toEqual([20, 20, 44]);
      expect(Math.round(list.x)).toBe(Math.round(home.right) + 12);
      expect(middle(title)).toBe(middle(home));
      expect(Math.round(title.x)).toBe(Math.round(list.right) + 12);
      expect(await shown(".ix-name-h").evaluate((el) => getComputedStyle(el).fontSize)).toBe("28px");
      const field = await box("#hm-form");
      expect(field.x).toBe(20);
      expect(Math.round(field.y - home.bottom)).toBe(14);
      const left = width / 2;
      expect(Math.round(field.right)).toBe(left - 20);
      const seg = await box(".ix-seg");
      const count = await box(".ix-count");
      expect(seg.x).toBe(20);
      expect(seg.y).toBeGreaterThan(field.bottom);
      expect(middle(count)).toBe(middle(seg));
      expect(Math.round(count.right)).toBe(left - 20);
      expect(await page.locator(".ix-count-t").isVisible()).toBe(false);
      // The group is the right pane's tools, at its top right, in the title row.
      const group = await box(".hm-group");
      expect(Math.round(group.right)).toBe(width - 20);
      expect(group.x).toBeGreaterThan(left);
      expect(middle(group)).toBe(middle(home));
      expect(await page.locator("#ix-search").isVisible()).toBe(false);
      expect(await page.locator(".ix-bar .hm-group").isVisible()).toBe(false);
    }
  },
  SLOW,
);

test(
  "on a phone the Home button, the title and the count share one row, the order switch under it",
  async () => {
    await open(402, COURSE, 874);
    const home = await box(".ix-up");
    const title = await box(".ix-flag");
    const count = await box(".ix-count");
    expect([home.x, home.y]).toEqual([20, 16]);
    expect(middle(title)).toBe(middle(home));
    expect(middle(count)).toBe(middle(home));
    expect(Math.round(count.right)).toBe(382);
    expect(Math.round(title.x)).toBe(Math.round(home.right) + 12);
    const seg = await box(".ix-seg");
    expect([seg.x, Math.round(seg.right)]).toEqual([20, 382]);
    expect(seg.y).toBeGreaterThan(home.bottom);
    expect(await page.locator(".sp-list").isVisible()).toBe(false);
  },
  SLOW,
);

test(
  "on a phone the bar holds the group at the left and a round Search button at the right end, which opens the field and Close closes it",
  async () => {
    await open(402, COURSE, 874);
    expect(await page.locator("#hm-form").isVisible()).toBe(false);
    const group = await box(".hm-group");
    const button = await box("#ix-search");
    expect(Math.round(group.x)).toBe(16);
    expect([Math.round(button.right), Math.round(button.right - button.x), Math.round(button.bottom - button.y)]).toEqual([386, 52, 48]);
    await page.click("#ix-search");
    expect(await page.locator("#hm-form").isVisible()).toBe(true);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("hm-q");
    expect(await page.locator("#ix-search").isVisible()).toBe(false);
    expect(await page.locator(".hm-group:visible").count()).toBe(0);
    const field = await box("#hm-form");
    const close = await box("#hm-close");
    expect([Math.round(field.x), Math.round(close.right)]).toEqual([16, 386]);
    await page.click("#hm-close");
    expect(await page.locator("#hm-form").isVisible()).toBe(false);
    expect(await page.locator("#ix-search").isVisible()).toBe(true);
    expect(await page.locator(".hm-group:visible").count()).toBe(1);
    await page.click("#ix-search");
    await page.keyboard.press("Escape");
    expect(await page.locator("#ix-search").isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "on a wide screen a query puts the filters under the field, which keeps its row with Close; the group stays in the right pane",
  async () => {
    for (const width of [1032, 1440]) {
      await open(width);
      await page.click("#hm-q");
      await page.keyboard.type("past");
      await page.locator(".hm-row").first().waitFor();
      const home = await box(".ix-up");
      const field = await box("#hm-form");
      const close = await box("#hm-close");
      const chip = await box(".hm-fchip");
      expect(Math.round(field.y - home.bottom)).toBe(14);
      expect(middle(close)).toBe(middle(field));
      expect(Math.round(close.right)).toBe(width / 2 - 20);
      expect(field.right).toBeLessThan(close.x);
      expect(chip.x).toBe(20);
      expect(chip.y).toBeGreaterThan(field.bottom);
      expect(await page.locator(".sp-tools .hm-group").isVisible()).toBe(true);
      expect(await page.locator(".ix-name-h").first().isVisible()).toBe(true);
    }
  },
  SLOW,
);

test(
  "the list button steps the left pane equal, slim and hidden: slim keeps the title row and the switch, hidden leaves Home and the list button",
  async () => {
    await open(1440);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.click(".sp-list");
    await leftWidth(320);
    expect(Math.round((await box(".ix-seg")).right)).toBeLessThanOrEqual(300);
    expect(await page.locator(".sp-title .ix-name-h").isVisible()).toBe(true);
    await page.click(".sp-list");
    expect(await page.locator(".sp-title .ix-name-h").isVisible()).toBe(false);
    expect(await page.locator(".ix-up").isVisible()).toBe(true);
    expect(await page.locator(".ix-seg").isVisible()).toBe(false);
    expect([(await box(".ix-up")).x, (await box(".ix-up")).y]).toEqual([20, 20]);
    await page.click(".sp-list");
    await leftWidth(720);
    await page.evaluate(() => {
      localStorage.clear();
    });
  },
  SLOW,
);

test(
  "the topic open in the right pane is marked in both orders and its row comes into view in the list",
  async () => {
    await open(1032, COURSE, 700);
    const path = await page.locator('.ix-flow[data-order="categories"] a.ix-cover').last().getAttribute("href");
    await page.evaluate((at) => {
      document.querySelector(".sp")?.setAttribute("data-sp-open", at);
      document.dispatchEvent(new CustomEvent("sp:shown"));
    }, path ?? "");
    const marked = page.locator("li[data-sp-chosen]");
    expect(await marked.count()).toBeGreaterThan(1);
    expect(await page.locator(`.ix-flow[data-order="categories"] li[data-sp-chosen] a[aria-current]`).count()).toBe(1);
    const row = await box('.ix-flow[data-order="categories"] li[data-sp-chosen]');
    expect(row.bottom).toBeLessThanOrEqual((await box(".sp-left")).bottom + 1);
    await page.evaluate(() => {
      document.querySelector(".sp")?.removeAttribute("data-sp-open");
      document.dispatchEvent(new CustomEvent("sp:shown"));
    });
    expect(await marked.count()).toBe(0);
  },
  SLOW,
);
