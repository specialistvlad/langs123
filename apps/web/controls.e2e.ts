// The page's controls. On a topic page: the level and the variety as buttons in the top glass group that open their
// menus under it, a choice or Escape closing them, the level button naming the chosen level; a level mark opens the
// level popover (level-popover.e2e.ts); on a small screen the bottom
// bar opens the contents and the course's index as sheets, and the bars slide away on a scroll down and return on a
// scroll up. On Home: the theme menu keeps its choice for the next page, and a first visit opens in the browser's
// language until the reader chooses one in Read in.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { LEVELS } from "../../scripts/lib.ts";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
// Each test opens a page; a cold browser can take seconds to start.
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage();
}, SLOW);
afterAll(async () => {
  await page.close();
});

// One page for every test, at the width each test asks for.
const TOPIC = "/en/english/verbs/to-be/?level=a1";
async function open(width: number, address = TOPIC): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(new URL(address, base).href);
}
// Waits for the page to draw its last change and for every slide that change started to end.
async function settled(): Promise<void> {
  await page.evaluate(async () => {
    for (let frame = 0; frame < 3; frame++) await new Promise((resolve) => requestAnimationFrame(resolve));
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
  });
}
const levelOf = (): Promise<string | undefined> => page.evaluate(() => document.documentElement.dataset["level"]);
const panelOpen = (id: string): Promise<boolean> => page.evaluate((p) => document.getElementById(p)?.matches(":popover-open") ?? false, id);
const LEVEL = '.tp-top [popovertarget="tp-levels"]';

test(
  "the level menu opens under the top group, lists every level, and a choice or Escape closes it",
  async () => {
    for (const width of [390, 1600]) {
      await open(width);
      await page.click(LEVEL);
      expect(await panelOpen("tp-levels")).toBe(true);
      // The menu opens clear of its button: under it, or beside the vertical bar of an unfolded phone.
      const button = await page.locator(LEVEL).boundingBox();
      const menu = await page.locator("#tp-levels").boundingBox();
      const under = (menu?.y ?? 0) >= (button?.y ?? 0) + (button?.height ?? 0);
      const beside = (menu?.x ?? 0) + (menu?.width ?? 0) <= (button?.x ?? 0);
      expect(under || beside).toBe(true);
      expect(await page.$$eval("#tp-levels [data-set-level]:not([data-all])", (els) => els.length)).toBe(LEVELS.length);
      await page.click('#tp-levels [data-set-level="B1"]');
      expect(await levelOf()).toBe("B1");
      expect(await panelOpen("tp-levels")).toBe(false);
      await page.click(LEVEL);
      await page.keyboard.press("Escape");
      expect(await panelOpen("tp-levels")).toBe(false);
    }
  },
  SLOW,
);

test(
  "the level button names the chosen level with its bar, and All levels at the top one",
  async () => {
    await open(1600);
    expect((await page.locator(".tp-top [data-level-label]").textContent())?.trim()).toBe("A1 Beginner");
    expect(await page.locator(".tp-top .lvm-one > i.on").getAttribute("class")).toBe("lv-A1 on");
    await page.click(LEVEL);
    await page.click("#tp-levels [data-all]");
    expect((await page.locator(".tp-top [data-level-label]").textContent())?.trim()).toBe("All levels");
    expect(await page.locator(".tp-top .lvm-one").isHidden()).toBe(true);
  },
  SLOW,
);

test(
  "on a small screen the bottom bar opens the contents and the index as sheets, and a link taken closes them",
  async () => {
    await open(390);
    await page.click('.tp-bar [popovertarget="tp-contents"]');
    expect(await panelOpen("tp-contents")).toBe(true);
    const sheet = await page.locator("#tp-contents").boundingBox();
    // A sheet floats just above the bottom edge.
    expect(800 - Math.round((sheet?.y ?? 0) + (sheet?.height ?? 0))).toBeLessThanOrEqual(8);
    await page.locator("#tp-contents .toc a").nth(1).click();
    expect(await panelOpen("tp-contents")).toBe(false);
    // The link scrolled down to its section, and the bars slid away with it: the page opens again.
    await open(390);
    await page.click('.tp-bar [popovertarget="tp-index"]');
    expect(await panelOpen("tp-index")).toBe(true);
    expect(await page.locator('#tp-index a[aria-current="page"]').isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "on a small screen the bars slide away on a scroll down and return on a scroll up",
  async () => {
    await open(390);
    // The bottom edge of the top group and the top edge of the bottom bar once their slides have finished.
    const edges = async (): Promise<number[]> => {
      await settled();
      return page.evaluate(() => [
        document.querySelector(".tp-top")?.getBoundingClientRect().bottom ?? -1,
        document.querySelector(".tp-bar")?.getBoundingClientRect().top ?? -1,
      ]);
    };
    const [top, bottom] = await edges();
    expect(top).toBeGreaterThan(0);
    expect(bottom).toBeLessThan(800);
    await page.evaluate(() => {
      scrollBy(0, 800);
    });
    const [topHidden, bottomHidden] = await edges();
    expect(topHidden).toBeLessThanOrEqual(0);
    expect(bottomHidden).toBeGreaterThanOrEqual(800);
    await page.evaluate(() => {
      scrollBy(0, -200);
    });
    expect((await edges())[0]).toBeGreaterThan(0);
  },
  SLOW,
);

test(
  "the theme menu sets the theme, ticks it, and the next page keeps it",
  async () => {
    await open(1600, "/");
    await page.click(".hm-theme");
    await page.click('#hm-themes [data-set-theme="dark"]');
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    expect(await page.locator('#hm-themes [data-set-theme="dark"]').getAttribute("aria-checked")).toBe("true");
    await page.goto(new URL("/en/english/", base).href);
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    await page.goto(new URL("/", base).href);
    await page.click(".hm-theme");
    await page.click('#hm-themes [data-set-theme="auto"]');
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBeUndefined();
  },
  SLOW,
);

test(
  "a first visit opens Home in the browser's language, until the reader chooses one in Read in",
  async () => {
    const context = await browser.newContext({ locale: "uk-UA" });
    const visit = await context.newPage();
    await visit.goto(new URL("/", base).href);
    await visit.waitForURL((url) => url.pathname === "/uk/");
    expect(await visit.evaluate(() => document.documentElement.lang)).toBe("uk");
    await visit.click(".hm-read summary");
    await visit.click('.hm-read [data-read="en"]');
    await visit.waitForURL((url) => url.pathname === "/");
    await visit.goto(new URL("/", base).href);
    expect(new URL(visit.url()).pathname).toBe("/");
    await context.close();
  },
  SLOW,
);
