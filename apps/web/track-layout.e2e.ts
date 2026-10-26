// A course index's layout in a browser: the Home button shares the title row (a wide screen: the topic count ends the
// order switch's row, the toolbar at the top right; a phone: the count ends the title row, the Search button at the
// bar's right end opens the field and Close closes it); while a query is typed on a wide screen the filters share the
// Home button's row.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
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
const box = async (selector: string): Promise<{ x: number; y: number; right: number; bottom: number }> => {
  const b = await page.locator(selector).first().boundingBox();
  return { x: b?.x ?? 0, y: b?.y ?? 0, right: (b?.x ?? 0) + (b?.width ?? 0), bottom: (b?.y ?? 0) + (b?.height ?? 0) };
};

const middle = (b: { y: number; bottom: number }): number => Math.round((b.y + b.bottom) / 2);

test(
  "on a wide screen the Home button and the title share the top row, the order switch and the count the second",
  async () => {
    for (const width of [1032, 1440]) {
      await open(width);
      const home = await box(".ix-up");
      const title = await box(".ix-flag");
      expect([home.x, home.y, home.bottom - home.y]).toEqual([20, 20, 44]);
      expect(middle(title)).toBe(middle(home));
      expect(Math.round(title.x)).toBe(Math.round(home.right) + 12);
      expect(await page.locator(".ix-name-h").evaluate((el) => getComputedStyle(el).fontSize)).toBe("28px");
      const seg = await box(".ix-seg");
      const count = await box(".ix-count");
      expect(seg.x).toBe(20);
      expect(seg.y).toBeGreaterThan(home.bottom);
      expect(middle(count)).toBe(middle(seg));
      expect(Math.round(count.right)).toBe(width - 20);
      // The toolbar sits at the top right, in the title row.
      const group = await box(".hm-group");
      const field = await box("#hm-form");
      expect(Math.round(group.right)).toBe(width - 20);
      expect(field.right).toBeLessThan(group.x);
      expect(middle(group)).toBe(middle(home));
      expect(await page.locator("#ix-search").isVisible()).toBe(false);
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
    expect(await page.locator(".hm-group").isVisible()).toBe(false);
    const field = await box("#hm-form");
    const close = await box("#hm-close");
    expect([Math.round(field.x), Math.round(close.right)]).toEqual([16, 386]);
    await page.click("#hm-close");
    expect(await page.locator("#hm-form").isVisible()).toBe(false);
    expect(await page.locator("#ix-search").isVisible()).toBe(true);
    expect(await page.locator(".hm-group").isVisible()).toBe(true);
    await page.click("#ix-search");
    await page.keyboard.press("Escape");
    expect(await page.locator("#ix-search").isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "on a wide screen a query puts the filters on the Home button's row, the field and Close at its right end",
  async () => {
    for (const width of [1032, 1440]) {
      await open(width);
      await page.click("#hm-q");
      await page.keyboard.type("past");
      await page.locator(".hm-row").first().waitFor();
      const home = await box(".ix-up");
      const chips = await box(".hm-filters");
      const chip = await box(".hm-fchip");
      expect([home.x, home.y]).toEqual([20, 20]);
      expect(middle(chip)).toBe(middle(home));
      expect(chip.x).toBe(home.right + 12);
      expect(chips.y).toBe(home.y);
      const field = await box("#hm-form");
      const close = await box("#hm-close");
      expect(middle(field)).toBe(middle(home));
      expect(Math.round(close.right)).toBe(width - 20);
      expect(field.x).toBeGreaterThan((await box(".hm-fchip:not([hidden]):last-child")).right);
    }
  },
  SLOW,
);
