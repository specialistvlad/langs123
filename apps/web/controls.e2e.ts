// The page's controls. On a topic page: the view as tabs; the level and the variety as buttons in the top
// glass group that open their panels under them on a wide screen and as sheets on a small one, a choice or
// Escape closing them; on a small screen the bottom bar opens the contents and the course's index as sheets,
// and the bars slide away on a scroll down and return on a scroll up. On a cheatsheet page: the top bar's
// search lists the topics and sections that match, moves through them with the arrow keys, opens one with
// Enter and closes on Escape; the menu opens from the bottom bar and closes on a tap beside it.
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
const TOPIC = "/en/english/verbs/to-be/?level=a1&view=extended";
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
const LEVEL = '.tp-top [popovertarget="level-panel"]';

test(
  "a small screen opens the level as a sheet along the bottom, and a choice or Escape closes it",
  async () => {
    await open(390);
    expect(await page.locator(".tp-bar").isVisible()).toBe(true);
    await page.click(LEVEL);
    expect(await panelOpen("level-panel")).toBe(true);
    const sheet = await page.locator("#level-panel").boundingBox();
    // A sheet floats just above the bottom edge.
    expect(800 - Math.round((sheet?.y ?? 0) + (sheet?.height ?? 0))).toBeLessThanOrEqual(8);
    expect(await page.$$eval("#level-panel [data-set-level]", (els) => els.filter((el) => el.checkVisibility()).length)).toBe(
      LEVELS.length,
    );
    await page.click('#level-panel [data-set-level="B1"]');
    expect(await levelOf()).toBe("B1");
    expect(await panelOpen("level-panel")).toBe(false);
    await page.click(LEVEL);
    await page.keyboard.press("Escape");
    expect(await panelOpen("level-panel")).toBe(false);
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
  "a wide screen names the level on its button and opens the panel under it",
  async () => {
    await open(1600);
    expect((await page.locator(".tp-top [data-level-label]").textContent())?.trim()).toBe("Up to A1");
    await page.click(LEVEL);
    const button = await page.locator(LEVEL).boundingBox();
    const panel = await page.locator("#level-panel").boundingBox();
    expect(panel?.y ?? 0).toBeGreaterThanOrEqual((button?.y ?? 0) + (button?.height ?? 0));
    await page.click('#level-panel [data-set-level="C2"]');
    expect((await page.locator(".tp-top [data-level-label]").textContent())?.trim()).toBe("All levels");
  },
  SLOW,
);

test(
  "the view is a pair of tabs, the chosen one marked",
  async () => {
    await open(1600);
    await page.click('.tabs [data-set-view="cheatsheet"]');
    expect(await page.evaluate(() => document.documentElement.dataset["view"])).toBe("cheatsheet");
    expect((await page.locator(".tabs .on").textContent())?.trim()).toBe("Cheatsheet");
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
  "a cheatsheet page's search lists the matching topics first, and the arrow keys, Enter and Escape work it",
  async () => {
    await open(1600, "/en/spanish/cheatsheets/?level=c2");
    const input = page.locator(".top-search input");
    await input.click();
    await input.fill("usted");
    await page.waitForSelector('#search-results:not([hidden]) [role="option"]');
    expect(await input.getAttribute("aria-expanded")).toBe("true");
    const groups = await page.$$eval("#search-results .hit-group", (els) => els.map((el) => el.textContent));
    expect(groups[0]).toBe("Topics");
    const first = page.locator('#search-results [role="option"]').first();
    expect(await first.locator(".hit-title").textContent()).toContain("Forms of Address");
    expect(await first.locator("mark").first().textContent()).toBe("usted");
    // The first row is marked; Down marks the second, and Enter opens it.
    const second = page.locator('#search-results [role="option"]').nth(1);
    const href = await second.getAttribute("href");
    await input.press("ArrowDown");
    expect(await input.getAttribute("aria-activedescendant")).toBe(await second.getAttribute("id"));
    await Promise.all([page.waitForURL((url) => url.pathname + url.hash === href), input.press("Enter")]);
  },
  SLOW,
);

test(
  "on a cheatsheet page a query that matches nothing says so, / moves to the search, and Escape closes it",
  async () => {
    await open(1600, "/en/english/cheatsheets/");
    await page.keyboard.press("/");
    expect(await page.evaluate(() => document.activeElement?.closest(".top-search") !== null)).toBe(true);
    await page.keyboard.type("zzzz");
    await page.waitForSelector("#search-results:not([hidden]) .hit-empty");
    expect(await page.locator('#search-results [role="option"]').count()).toBe(0);
    await page.locator(".top-search input").press("Escape");
    expect(await page.locator("#search-results").isHidden()).toBe(true);
  },
  SLOW,
);

test(
  "on a small screen a cheatsheet page's menu opens from the bottom bar, shows the logo and closes on a tap beside it",
  async () => {
    await open(390, "/en/english/cheatsheets/");
    await page.click("#menu");
    await settled();
    expect(await page.locator(".sidebar .nav-brand").isVisible()).toBe(true);
    const before = page.url();
    // The page beside the menu, over a link of the document.
    await page.mouse.click(360, 400);
    expect(await page.evaluate(() => document.body.classList.contains("nav-open"))).toBe(false);
    expect(page.url()).toBe(before);
  },
  SLOW,
);
