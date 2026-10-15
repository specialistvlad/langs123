// The page's controls: the view as tabs; the level and the variety as chips that open their panels under
// them on a wide screen; on a small screen a bottom bar opens the menu, the level and More as sheets, a
// choice or Escape closes a sheet, and the top bar slides away on a scroll down and returns on a scroll
// up; the menu shows the logo and closes on a tap beside it; the top bar's search lists the topics and
// sections that match, moves through them with the arrow keys, opens one with Enter and closes on Escape.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { type Browser, chromium, type Page } from "playwright";
import { LEVELS } from "../../scripts/lib.ts";
import { SITE_DIR, testSite } from "./test-site.ts";

await testSite();
// Each test opens a page; a cold browser can take seconds to start.
const SLOW = 30_000;
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: (req) => {
    const file = decodeURIComponent(new URL(req.url).pathname);
    return new Response(Bun.file(join(SITE_DIR, file.endsWith("/") ? `${file}index.html` : file)));
  },
});
let browser: Browser;
let page: Page;
beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
}, SLOW);
afterAll(async () => {
  await browser.close();
  await server.stop();
});

// One page for every test, as the other browser tests keep, at the width each test asks for.
async function open(width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(new URL("/en/english/verbs/to-be/?level=a1&view=extended", server.url).href);
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

test(
  "a small screen opens the level from the bottom bar as a sheet, and a choice or Escape closes it",
  async () => {
    await open(390);
    expect(await page.locator(".bottom-bar").isVisible()).toBe(true);
    expect(await page.locator(".topbar .tools").isVisible()).toBe(false);
    await page.click('.bottom-bar [popovertarget="level-panel"]');
    expect(await panelOpen("level-panel")).toBe(true);
    const sheet = await page.locator("#level-panel").boundingBox();
    expect(Math.round((sheet?.y ?? 0) + (sheet?.height ?? 0))).toBe(800);
    expect(await page.$$eval("#level-panel [data-set-level]", (els) => els.filter((el) => el.checkVisibility()).length)).toBe(
      LEVELS.length,
    );
    await page.click('#level-panel [data-set-level="B1"]');
    expect(await levelOf()).toBe("B1");
    expect(await panelOpen("level-panel")).toBe(false);
    await page.click('.bottom-bar [popovertarget="level-panel"]');
    await page.keyboard.press("Escape");
    expect(await panelOpen("level-panel")).toBe(false);
  },
  SLOW,
);

test(
  "More on a small screen holds the languages a page is read in, the credits and the theme",
  async () => {
    await open(390);
    await page.click('.bottom-bar [popovertarget="more-panel"]');
    expect(await panelOpen("more-panel")).toBe(true);
    expect(await page.locator("#more-panel .menu-list a").count()).toBeGreaterThan(1);
    expect(await page.locator("#more-panel [data-theme-toggle]").isVisible()).toBe(true);
    expect(await page.locator('#more-panel a[href$="/credits/"]').isVisible()).toBe(true);
  },
  SLOW,
);

test(
  "a wide screen names the level on its chip, opens the panel under the chip, and keeps the logo in the top bar",
  async () => {
    await open(1600);
    expect(await page.locator(".bottom-bar").isVisible()).toBe(false);
    expect((await page.locator(".topbar [data-level-label]").textContent())?.trim()).toBe("Up to A1");
    await page.click('.topbar [popovertarget="level-panel"]');
    const chip = await page.locator('.topbar [popovertarget="level-panel"]').boundingBox();
    const panel = await page.locator("#level-panel").boundingBox();
    expect(panel?.y ?? 0).toBeGreaterThanOrEqual((chip?.y ?? 0) + (chip?.height ?? 0));
    await page.click('#level-panel [data-set-level="C2"]');
    expect((await page.locator(".topbar [data-level-label]").textContent())?.trim()).toBe("All levels");
    expect(await page.locator(".topbar .brand").isVisible()).toBe(true);
    expect(await page.locator(".sidebar .nav-brand").isVisible()).toBe(false);
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
  "the top bar's search lists the matching topics first, and the arrow keys, Enter and Escape work it",
  async () => {
    await page.setViewportSize({ width: 1600, height: 800 });
    await page.goto(new URL("/en/spanish/pronombres/tu-usted-vosotros-ustedes/?level=c2", server.url).href);
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
    // Escape closes the list.
    await page.locator(".top-search input").fill("usted");
    await page.waitForSelector('#search-results:not([hidden]) [role="option"]');
    await page.locator(".top-search input").press("Escape");
    expect(await page.locator("#search-results").isHidden()).toBe(true);
    expect(await page.locator(".top-search input").getAttribute("aria-expanded")).toBe("false");
  },
  SLOW,
);

test(
  "a query that matches nothing says so, and / moves to the search",
  async () => {
    await open(1600);
    await page.keyboard.press("/");
    expect(await page.evaluate(() => document.activeElement?.closest(".top-search") !== null)).toBe(true);
    await page.keyboard.type("zzzz");
    await page.waitForSelector("#search-results:not([hidden]) .hit-empty");
    expect(await page.locator('#search-results [role="option"]').count()).toBe(0);
  },
  SLOW,
);

test(
  "on a small screen the top bar slides away on a scroll down and returns on a scroll up",
  async () => {
    await open(390);
    // The bottom edge of the bar once its slide has finished.
    const edge = async (): Promise<number> => {
      await settled();
      return page.evaluate(() => document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? -1);
    };
    expect(await edge()).toBeGreaterThan(0);
    await page.evaluate(() => {
      scrollBy(0, 800);
    });
    expect(await edge()).toBeLessThanOrEqual(0);
    await page.evaluate(() => {
      scrollBy(0, -200);
    });
    expect(await edge()).toBeGreaterThan(0);
  },
  SLOW,
);

test(
  "on a small screen the menu opens from the bottom bar, shows the logo and closes on a tap beside it",
  async () => {
    await open(390);
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
