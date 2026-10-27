// A course index's layout in a browser. From 1024px a course is two columns: the topics column (248 wide from 1024,
// 320 from 1280) holds the toolbar line (Home, Level and Group as icon buttons), the course's title on its own line, "66
// topics · Explained in: English ›", the field and the topics; the reading's placeholder fills the rest, with Variety
// and More at its top right. While the field searches the head gives way (Home beside the title) and the bar gains Level
// and Group. A phone: the Home button, the title and the count share the title row, the line under it; the bar at the
// bottom holds the buttons and the Search button at its right end, which opens the field; Group by opens from either.
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
// The first of the elements that are shown: the buttons are in the head, in the bar and in the phone's bar.
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
const middle = (b: { y: number; bottom: number }): number => Math.round((b.y + b.bottom) / 2);
const style = (selector: string, property: string): Promise<string> =>
  shown(selector).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

test(
  "on a wide screen the head holds Home and the buttons, the title on its own line, the line, then the field and the topics",
  async () => {
    for (const [width, column, pad, up, name, row] of [
      [1032, 248, 16, 40, "28px", "15px"],
      [1280, 320, 20, 44, "28px", "17px"],
      [1440, 320, 20, 44, "28px", "17px"],
    ] as const) {
      await open(width);
      expect(Math.round((await box(".cl-side")).right)).toBe(column);
      const home = await box(".cl-home");
      const tools = await box(".cl-tools");
      const title = await box(".ix-flag");
      expect([home.x, home.y, home.bottom - home.y]).toEqual([pad, pad + (44 - up) / 2, up]);
      expect(Math.round(tools.right)).toBe(column - pad);
      expect(middle(tools)).toBe(middle(home));
      expect(title.y).toBeGreaterThan(home.bottom);
      expect(await style(".cl-name", "font-size")).toBe(name);
      expect(await shown(".cl-line").innerText()).toMatch(/^\d+ topics · Explained in: English$/);
      expect(await style(".cl-line", "font-size")).toBe(width < 1280 ? "13px" : "15px");
      const line = await box(".cl-line");
      const field = await box("#hm-form");
      expect(Math.round(field.y - line.bottom)).toBeGreaterThanOrEqual(10);
      expect(field.x).toBe(pad);
      expect(Math.round(field.right)).toBe(column - pad);
      expect(await style(".ix-name", "font-size")).toBe(row);
      expect(await visible("#ix-search")).toBe(false);
      expect(await visible(".cl-count")).toBe(false);
      expect(await visible(".cl-choose")).toBe(true);
      // Variety and More sit at the window's top right; Level and Group are in the head.
      const bar = await box(".cl-bar");
      expect(Math.round(bar.right)).toBe(width - 20);
      expect(bar.y).toBe(20);
      expect(await visible(".cl-bar .ix-variety")).toBe(true);
      expect(await visible(".cl-bar .hm-more")).toBe(true);
      expect(await visible(".cl-bar .ix-level, .cl-bar .ix-group")).toBe(false);
    }
  },
  SLOW,
);

test(
  "the topics column keeps its head and field while the topics scroll in it",
  async () => {
    await open(1440, COURSE, 700);
    await page.evaluate(() => document.querySelector<HTMLElement>(".cl-side")?.scrollTo(0, 600));
    expect((await box(".cl-home")).y).toBe(20);
    expect((await box("#hm-form")).y).toBeLessThan(200);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  },
  SLOW,
);

test(
  "on a phone the Home button, the title and the count share one row, the line under it",
  async () => {
    await open(402, COURSE, 874);
    const home = await box(".cl-home");
    const title = await box(".ix-flag");
    const count = await box(".cl-head .ix-count");
    expect([home.x, home.y]).toEqual([20, 16]);
    expect(middle(title)).toBe(middle(home));
    expect(middle(count)).toBe(middle(home));
    expect(Math.round(count.right)).toBe(382);
    expect(Math.round(title.x)).toBe(Math.round(home.right) + 12);
    expect(await shown(".cl-line").innerText()).toBe("Explained in: English");
    const line = await box(".cl-line");
    expect(Math.round(line.x)).toBe(76);
    expect(line.y).toBeGreaterThan(home.bottom);
    expect(await visible(".cl-tools, .cl-choose")).toBe(false);
    expect(await visible(".ix-seg")).toBe(false);
  },
  SLOW,
);

test(
  "on a phone the bar holds the buttons at the left and a round Search button at the right end, which opens the field and Close closes it",
  async () => {
    await open(402, COURSE, 874);
    expect(await visible("#hm-form")).toBe(false);
    const group = await box(".cl-bar");
    const button = await box("#ix-search");
    expect(Math.round(group.x)).toBe(16);
    expect(await page.locator(".cl-bar .ix-btn, .cl-bar .hm-more").filter({ visible: true }).count()).toBe(4);
    expect([Math.round(button.right), Math.round(button.right - button.x), Math.round(button.bottom - button.y)]).toEqual([386, 52, 48]);
    await page.click("#ix-search");
    expect(await visible("#hm-form")).toBe(true);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("hm-q");
    expect(await visible("#ix-search")).toBe(false);
    expect(await visible(".cl-bar")).toBe(false);
    const field = await box("#hm-form");
    const close = await box("#hm-close");
    expect([Math.round(field.x), Math.round(close.right)]).toEqual([16, 386]);
    await page.click("#hm-close");
    expect(await visible("#hm-form")).toBe(false);
    expect(await visible("#ix-search")).toBe(true);
    expect(await visible(".cl-bar")).toBe(true);
    await page.click("#ix-search");
    await page.keyboard.press("Escape");
    expect(await visible("#ix-search")).toBe(true);
  },
  SLOW,
);

test(
  "on a wide screen a query puts Home beside the title and the filters under the field, which keeps its row with Close; the bar gains Level and Group",
  async () => {
    for (const width of [1032, 1440]) {
      await open(width);
      await page.click("#hm-q");
      await page.keyboard.type("past");
      await page.locator(".hm-row").first().waitFor();
      const home = await box(".cl-home");
      const title = await box(".ix-flag");
      const field = await box("#hm-form");
      const close = await box("#hm-close");
      const chip = await box(".hm-fchip");
      expect(middle(title)).toBe(middle(home));
      expect(await visible(".cl-tools")).toBe(false);
      expect(await visible(".cl-n")).toBe(false);
      expect(await shown(".cl-line").innerText()).toBe("Explained in: English");
      expect(middle(close)).toBe(middle(field));
      expect(field.right).toBeLessThan(close.x);
      expect(chip.y).toBeGreaterThan(field.bottom);
      expect(await page.locator(".cl-bar .ix-btn, .cl-bar .hm-more").filter({ visible: true }).count()).toBe(4);
      expect(await visible("#hm-cards")).toBe(false);
    }
  },
  SLOW,
);
