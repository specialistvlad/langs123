// A topic page's controls: the Level button opens the level popover headed by the course and names the chosen level; on
// a wide screen the group sits in the right pane's tools and the left pane's contents mark the part being read; on a
// small screen the title row holds the up link, the bottom bar holds Contents, the group and Search and slides away
// on a scroll down, and a search puts its results in place of the lesson.
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
// The toolbar group of Level, Variety and Read in: the right pane's tools on a wide screen, the bar's on a phone.
const WIDE = ".sp-tools";
const BAR = ".tp-bar .hm-group:not(.tp-bar-left)";
const LEVEL = `${WIDE} [popovertarget="lv-pop"], ${BAR} [popovertarget="lv-pop"]`;

test(
  "the Level button opens the level popover headed by the course, lists every level, and a choice or Escape closes it",
  async () => {
    for (const width of [390, 1600]) {
      await open(width);
      await page.locator(LEVEL).locator("visible=true").click();
      expect(await panelOpen("lv-pop")).toBe(true);
      expect((await page.locator("#lv-pop-t").textContent())?.trim()).toBe("English");
      // On a wide screen the popover opens clear of its button, under the group; on a phone it is a sheet.
      if (width > 860) {
        const button = await page.locator(LEVEL).locator("visible=true").boundingBox();
        const menu = await page.locator("#lv-pop").boundingBox();
        expect((menu?.y ?? 0) >= (button?.y ?? 0) + (button?.height ?? 0)).toBe(true);
      }
      expect(await page.$$eval("#lv-pop .lv-row", (els) => els.length)).toBe(LEVELS.length);
      await page.click('#lv-pop [data-set-level="A2"]');
      expect(await levelOf()).toBe("A2");
      expect(await panelOpen("lv-pop")).toBe(false);
      await page.locator(LEVEL).locator("visible=true").click();
      await page.keyboard.press("Escape");
      expect(await panelOpen("lv-pop")).toBe(false);
    }
  },
  SLOW,
);

test(
  "the level button names the chosen level, and All levels at the top one",
  async () => {
    await open(1600);
    expect((await page.locator(`${WIDE} [data-level-label]`).textContent())?.trim()).toBe("Beginner");
    await page.locator(LEVEL).locator("visible=true").click();
    await page.click("#lv-pop [data-row]:last-child");
    expect((await page.locator(`${WIDE} [data-level-label]`).textContent())?.trim()).toBe("All levels");
  },
  SLOW,
);

test(
  "on a small screen the bottom bar opens the contents as a sheet, and a link taken closes it",
  async () => {
    await open(390);
    await page.click('.tp-bar [popovertarget="tp-contents"]');
    expect(await panelOpen("tp-contents")).toBe(true);
    const sheet = await page.locator("#tp-contents").boundingBox();
    expect(800 - Math.round((sheet?.y ?? 0) + (sheet?.height ?? 0))).toBeLessThanOrEqual(8);
    await page.locator("#tp-contents .toc a").nth(1).click();
    expect(await panelOpen("tp-contents")).toBe(false);
  },
  SLOW,
);

test(
  "on a wide screen the left pane lists the contents and marks the part being read as the lesson scrolls",
  async () => {
    await open(1600);
    expect(await page.locator("#hm-cards .toc a.on").count()).toBe(1);
    const second = page.locator("#hm-cards .toc a").nth(2);
    const id = (await second.getAttribute("href"))?.slice(1) ?? "";
    await second.click();
    await settled();
    await page.waitForFunction((part) => document.querySelector("#hm-cards .toc a.on")?.getAttribute("href") === `#${part}`, id);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.locator(".sp-right").evaluate((pane) => pane.scrollTop)).toBeGreaterThan(0);
    await page.locator(".sp-right").evaluate((pane) => {
      pane.scrollTop = 0;
    });
    const first = (await page.locator("#hm-cards .toc a").first().getAttribute("href")) ?? "";
    await page.waitForFunction((part) => document.querySelector("#hm-cards .toc a.on")?.getAttribute("href") === part, first);
  },
  SLOW,
);

test(
  "on a wide screen a search puts its results in the left pane and leaves the lesson where it is",
  async () => {
    await open(1600);
    await page.fill("#hm-q", "past");
    await page.locator(".hm-row").first().waitFor();
    expect(await page.locator("#hm-cards").isHidden()).toBe(true);
    expect(await page.locator(".sp-right .tp-wrap").isVisible()).toBe(true);
    expect(await page.locator(`${WIDE} .hm-group`).isVisible()).toBe(true);
    await page.click("#hm-close");
    expect(await page.locator("#hm-cards").isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "on a small screen the title row holds the up link and the title, and the bottom bar holds Contents, the group and Search",
  async () => {
    await open(390);
    const box = async (selector: string): Promise<{ x: number; y: number; width: number; height: number }> => {
      const found = await page.locator(selector).first().boundingBox();
      if (found === null) throw new Error(`${selector} is not on the page`);
      return found;
    };
    const up = await box(".tp-up");
    const title = await box(".tp-head h1");
    expect(Math.abs(up.y + up.height / 2 - (title.y + title.height / 2))).toBeLessThan(30);
    expect(up.x + up.width).toBeLessThanOrEqual(title.x);
    const [contents, group, search] = await Promise.all([box(".tp-bar-left"), box(BAR), box("#ix-search")]);
    expect(contents.x + contents.width).toBeLessThanOrEqual(group.x);
    expect(group.x + group.width).toBeLessThanOrEqual(search.x);
    expect(Math.round(search.x + search.width)).toBe(390 - 16);
  },
  SLOW,
);

test(
  "on a small screen the Search button opens the field across the bar, and its results replace the lesson",
  async () => {
    await open(390);
    await page.click("#ix-search");
    await page.keyboard.type("past");
    await page.locator(".hm-row").first().waitFor();
    expect(await page.locator(".sp-right").isHidden()).toBe(true);
    expect(await page.locator(BAR).isHidden()).toBe(true);
    await page.click("#hm-close");
    expect(await page.locator(".sp-right").isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "on a small screen the bar slides away on a scroll down and returns on a scroll up and at the page's end",
  async () => {
    await open(390);
    const edge = async (): Promise<number> => {
      await settled();
      return page.evaluate(() => document.querySelector(".tp-bar")?.getBoundingClientRect().top ?? -1);
    };
    expect(await edge()).toBeLessThan(800);
    await page.evaluate(() => {
      scrollBy(0, 800);
    });
    expect(await edge()).toBeGreaterThanOrEqual(800);
    await page.evaluate(() => {
      scrollBy(0, -200);
    });
    expect(await edge()).toBeLessThan(800);
    await page.evaluate(() => {
      scrollBy(0, 100000);
    });
    expect(await edge()).toBeLessThan(800);
  },
  SLOW,
);
