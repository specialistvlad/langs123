// The split view in a browser: the Home's right pane asks for a course and shows the course chosen with its address
// (Back and reload keep it), a topic opened there leads to the course index with the topic chosen in the address, the
// credits link leads to the credits page, the list button steps equal -> slim -> hidden and the reader's state
// stays, the divider drags, and a phone navigates as before.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

const width = (selector: string): Promise<number> => page.locator(selector).evaluate((el) => Math.round(el.getBoundingClientRect().width));
const split = (): Promise<string | null> => page.locator(".sp").getAttribute("data-split");

test(
  "a course chosen fills the right pane, outlines its card and keeps its address for Back and reload",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    expect(await page.locator(".sp-choose-t").textContent()).toBe("Choose a course");
    expect(await page.locator(".sp-choose-s").textContent()).toBe("Its topics open here.");
    const link = page.locator(".hm-course-a").first();
    const path = (await link.getAttribute("href")) ?? "";
    await link.click();
    await page.locator(".sp-body .ix-rows a").first().waitFor();
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(`/?open=${path}`);
    expect(await page.locator(".sp-choose").count()).toBe(0);
    expect(await page.locator(".hm-card[data-sp-chosen] .hm-course-a").first().getAttribute("href")).toBe(path);
    expect(await page.locator(".sp-body #hm-cards").count()).toBe(0);
    // The course's Level, Variety and Read in sit at the pane's top right, the theme and the credits in the title row.
    expect(await page.locator(".sp-tools .hm-group .ix-level").isVisible()).toBe(true);
    expect(await page.locator(".sp-title .sp-own").isVisible()).toBe(true);
    // A topic opened from the pane leads to the course index with the topic chosen.
    const topic = (await page.locator(".sp-body .ix-rows a").first().getAttribute("href")) ?? "";
    expect(topic.startsWith(`${path}?open=${path}`)).toBe(true);
    await page.reload();
    await page.locator(".sp-body .ix-rows a").first().waitFor();
    expect(await page.locator(".hm-card[data-sp-chosen]").count()).toBe(1);
    await page.goBack();
    await page.locator(".sp-choose").waitFor();
    expect([await page.locator(".sp-body .ix-rows").count(), await page.locator(".hm-card[data-sp-chosen]").count()]).toEqual([0, 0]);
    await page.goForward();
    await page.locator(".sp-body .ix-rows a").first().waitFor();
  },
  SLOW,
);

test(
  "a level chosen filters the course in the pane, leaves the Home's cards alone, and the filter ends with the pane",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator(".hm-course-a").first().click();
    await page.locator(".sp-body .ix-rows a").first().waitFor();
    expect(await page.evaluate(() => document.documentElement.dataset["spPage"])).toBe("track");
    const hidden = (selector: string): Promise<number> =>
      page.locator(selector).evaluateAll((els) => els.filter((el) => getComputedStyle(el).display === "none").length);
    const rows = ".sp-body .ix-flow[data-order=categories] .ix-rows > li[data-level]";
    expect(await hidden(rows)).toBe(0);
    await page.evaluate(() => {
      document.documentElement.dataset["level"] = "A0";
    });
    expect(await hidden(rows)).toBeGreaterThan(0);
    expect(await hidden(".sp-left .hm-card, .sp-left .hm-chip")).toBe(0);
    await page.goBack();
    await page.locator(".sp-choose").waitFor();
    expect(await page.evaluate(() => document.documentElement.dataset["spPage"])).toBeUndefined();
    await page.evaluate(() => {
      localStorage.clear();
    });
  },
  SLOW,
);

test(
  "the Credits link leads to the credits page: one centred column of at most 680px with Home beside the heading",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator(".sp-tools .hm-credits").click();
    await page.waitForURL(new URL("/credits/", base).href);
    expect(await page.locator(".sp").count()).toBe(0);
    expect(await page.locator("#cr-credit").textContent()).toContain("CC BY");
    const box = (selector: string): Promise<{ left: number; right: number; mid: number; width: number }> =>
      page.locator(selector).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, mid: r.top + r.height / 2, width: r.width };
      });
    const main = await box(".cr-main");
    expect([main.width, Math.abs(main.left + main.right - 1280) < 2]).toEqual([680, true]);
    const [up, heading] = [await box(".cr-head .pg-up"), await box(".cr-heading")];
    expect([up.width, up.right < heading.left, Math.abs(up.mid - heading.mid) < 4]).toEqual([44, true, true]);
    expect(await page.locator("[data-sp-close], .sp-x").count()).toBe(0);
    await page.locator(".cr-head .pg-up").click();
    await page.waitForURL(new URL("/", base).href);
  },
  SLOW,
);

test(
  "the list button steps equal, slim and hidden, names the next step, and the state stays for the next page",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    const button = page.locator(".sp-title .sp-list");
    const state = async (): Promise<[string | null, number, string | null]> => [
      await split(),
      await width(".sp-left"),
      await button.getAttribute("aria-label"),
    ];
    expect(await state()).toEqual(["equal", 640, "Narrow the list"]);
    await button.click();
    await page.waitForTimeout(300);
    expect(await state()).toEqual(["slim", 320, "Hide the list"]);
    await button.click();
    await page.waitForTimeout(300);
    expect(await state()).toEqual(["hidden", 0, "Show the list"]);
    expect([
      await button.isVisible(),
      await page.locator(".sp-left .hm-card").first().isVisible(),
      await page.locator(".sp-div").isVisible(),
    ]).toEqual([true, false, false]);
    await page.reload();
    expect(await state()).toEqual(["hidden", 0, "Show the list"]);
    await button.click();
    await page.waitForTimeout(300);
    expect((await state())[0]).toBe("equal");
  },
  SLOW,
);

test(
  "the divider drags and the width stays; the arrow keys move it",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    const box = (await page.locator(".sp-div").boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
    await page.mouse.move(box.x + box.width / 2, 400);
    await page.mouse.down();
    await page.mouse.move(420, 400, { steps: 5 });
    await page.mouse.up();
    expect(Math.abs((await width(".sp-left")) - 420)).toBeLessThan(3);
    await page.reload();
    expect(Math.abs((await width(".sp-left")) - 420)).toBeLessThan(3);
    await page.locator(".sp-div").focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    expect(await width(".sp-left")).toBeGreaterThan(440);
    // The panes keep their least widths.
    await page.mouse.move(box.x, 400);
    await page.mouse.down();
    await page.mouse.move(5, 400, { steps: 3 });
    await page.mouse.up();
    expect(await width(".sp-left")).toBeGreaterThanOrEqual(280);
    await page.evaluate(() => {
      localStorage.clear();
    });
  },
  SLOW,
);

test(
  "a phone shows the Home alone and a link navigates to the course",
  async () => {
    const phone = await browser.newPage({ viewport: { width: 402, height: 800 } });
    await phone.goto(new URL("/", base).href);
    expect([
      await phone.locator(".sp-right").isVisible(),
      await phone.locator(".sp-list").isVisible(),
      await phone.locator(".sp-own").isVisible(),
    ]).toEqual([false, false, false]);
    const path = (await phone.locator(".hm-course-a").first().getAttribute("href")) ?? "";
    await phone.locator(".hm-course-a").first().click();
    await phone.waitForURL(new URL(path, base).href);
    await phone.goto(new URL("/credits/", base).href);
    expect([
      await phone.locator(".sp").count(),
      await phone.locator(".cr-head .pg-up").isVisible(),
      await phone.locator(".cr-heading").isVisible(),
    ]).toEqual([0, true, true]);
    await phone.close();
  },
  SLOW,
);
