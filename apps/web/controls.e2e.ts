// A topic page's controls: the Level button opens the level popover headed by the course and names the chosen level; on
// a wide screen the outline at the reading's top right marks the part in view as the page scrolls and scrolls to the
// part chosen, and a search puts its results in the topics column; on a small screen the title row holds Back, the bottom
// bar holds Level, Variety, More and Search and slides away on a scroll down, and a search puts its results in place of
// the lesson.
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

// One page for every test, at the width each test asks for; a phone opens on the reading (#summary).
const TOPIC = "/en/english/verbs/to-be/?level=a1";
async function open(width: number, address = TOPIC): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(new URL(width < 1024 ? `${address}#summary` : address, base).href);
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
// The Level button: in the topics column's head on a wide screen, in the bottom bar on a phone.
const LEVEL = '.cl-tools [popovertarget="lv-pop"], .cl-bar [popovertarget="lv-pop"]';
const level = (): ReturnType<Page["locator"]> => page.locator(LEVEL).locator("visible=true");

test(
  "the Level button opens the level popover headed by the course, lists every level, and a choice or Escape closes it",
  async () => {
    for (const width of [390, 1600]) {
      await open(width);
      await level().click();
      expect(await panelOpen("lv-pop")).toBe(true);
      expect((await page.locator("#lv-pop-t").textContent())?.trim()).toBe("English");
      // On a wide screen the popover opens clear of its button, under the head's buttons; on a phone it is a sheet.
      if (width > 1023) {
        const button = await page.locator(".cl-tools").boundingBox();
        const menu = await page.locator("#lv-pop").boundingBox();
        expect((menu?.y ?? 0) >= (button?.y ?? 0) + (button?.height ?? 0)).toBe(true);
      }
      expect(await page.$$eval("#lv-pop .lv-row", (els) => els.length)).toBe(LEVELS.length);
      await page.click('#lv-pop [data-set-level="A2"]');
      expect(await levelOf()).toBe("A2");
      expect(await panelOpen("lv-pop")).toBe(false);
      await level().click();
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
    expect((await page.locator(".cl-tools [data-level-label]").textContent())?.trim()).toBe("Beginner");
    await level().click();
    await page.click("#lv-pop [data-row]:last-child");
    expect((await page.locator(".cl-tools [data-level-label]").textContent())?.trim()).toBe("All levels");
  },
  SLOW,
);

test(
  "on a wide screen the outline marks the part in view as the page scrolls, and a part chosen is scrolled to",
  async () => {
    await open(1600);
    const outline = page.locator(".tp-outline");
    expect(await outline.locator("a.on").count()).toBe(1);
    expect(await outline.locator("a").count()).toBe(await page.locator(".tp-body .sections > section.part").count());
    const third = outline.locator("a").nth(2);
    const id = (await third.getAttribute("href"))?.slice(1) ?? "";
    await third.click();
    await page.waitForFunction((part) => document.querySelector(".tp-outline a.on")?.getAttribute("href") === `#${part}`, id);
    await page.waitForFunction(() => scrollY > 0);
    await settled();
    await page.waitForFunction((part) => Math.abs((document.getElementById(part)?.getBoundingClientRect().top ?? 0) - 84) < 2, id);
    // Scrolling on moves the mark to the part whose heading has passed the top of the reading.
    const next = await page.evaluate((part) => {
      const shown = [...document.querySelectorAll<HTMLElement>(".tp-body .sections > section.part")].filter((el) => el.offsetHeight > 0);
      return shown[shown.findIndex((el) => el.id === part) + 1]?.id ?? "";
    }, id);
    expect(next).not.toBe("");
    await page.evaluate((part) => {
      document.documentElement.style.scrollBehavior = "auto";
      scrollBy(0, (document.getElementById(part)?.getBoundingClientRect().top ?? 0) - 90);
    }, next);
    await page.waitForFunction((part) => document.querySelector(".tp-outline a.on")?.getAttribute("href") === `#${part}`, next);
    await page.evaluate(() => {
      scrollTo(0, 0);
    });
    const first = (await outline.locator("a").first().getAttribute("href")) ?? "";
    await page.waitForFunction((part) => document.querySelector(".tp-outline a.on")?.getAttribute("href") === part, first);
  },
  SLOW,
);

test(
  "on a wide screen a search puts its results in the topics column and leaves the lesson where it is",
  async () => {
    await open(1600);
    await page.fill("#hm-q", "past");
    await page.locator(".hm-row").first().waitFor();
    expect(await page.locator("#hm-cards").isHidden()).toBe(true);
    expect(await page.locator(".cl-main .tp-wrap").isVisible()).toBe(true);
    expect(await page.locator(".cl-bar").isVisible()).toBe(true);
    // The head names the topic with Back to the course while the field searches.
    expect(await page.locator(".cl-back").isVisible()).toBe(true);
    expect((await page.locator(".cl-topic").innerText()).trim()).toBe((await page.locator(".tp-head h1").innerText()).trim());
    await page.click("#hm-close");
    expect(await page.locator("#hm-cards").isVisible()).toBe(true);
    expect(await page.locator(".cl-home").isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "on a small screen the title row holds Back and the title, and the bottom bar holds the buttons and Search",
  async () => {
    await open(390);
    const box = async (selector: string): Promise<{ x: number; y: number; width: number; height: number }> => {
      const found = await page.locator(selector).filter({ visible: true }).first().boundingBox();
      if (found === null) throw new Error(`${selector} is not on the page`);
      return found;
    };
    const up = await box(".tp-back");
    const title = await box(".tp-head h1");
    expect(Math.abs(up.y + up.height / 2 - (title.y + title.height / 2))).toBeLessThan(30);
    expect(up.x + up.width).toBeLessThanOrEqual(title.x);
    const [group, search] = await Promise.all([box(".cl-bar"), box("#ix-search")]);
    expect(group.x + group.width).toBeLessThanOrEqual(search.x);
    expect(Math.round(search.x + search.width)).toBe(390 - 16);
    expect(await page.locator(".cl-bar .ix-btn, .cl-bar .hm-more").filter({ visible: true }).count()).toBe(3);
    expect(await page.locator(".cl-side .cl-head").isVisible()).toBe(false);
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
    expect(await page.locator(".cl-main").isHidden()).toBe(true);
    expect(await page.locator(".cl-bar").isHidden()).toBe(true);
    await page.click("#hm-close");
    expect(await page.locator(".cl-main").isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "on a small screen the bar slides away on a scroll down and returns on a scroll up and at the page's end",
  async () => {
    await open(390);
    const edge = async (): Promise<number> => {
      await settled();
      return page.evaluate(() => document.querySelector(".cl-nav")?.getBoundingClientRect().top ?? -1);
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
