// The level popover in a browser: a level mark opens it with the element's name, what each level covers there and
// a choice that sets the level; on a small screen a scroll over it scrolls the popover and leaves the page still.
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

async function open(width: number, address: string): Promise<void> {
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

test(
  "a level mark opens the popover: the element's name, what each level covers, and a choice that sets the level",
  async () => {
    await open(1600, "/en/english/verbs/to-be/?level=c2");
    await page.click(".doc-head .lvm-b");
    expect(await panelOpen("lv-pop")).toBe(true);
    expect(await page.locator("#lv-pop .lv-pop-t").textContent()).toBe("To be");
    // Each level the topic holds says what it covers; a level it lacks dims.
    const rows = await page.$$eval("#lv-pop [data-row]", (els) =>
      els.map((el) => [el.getAttribute("data-row"), el.classList.contains("lv-off"), el.querySelector(".lv-here")?.textContent ?? ""]),
    );
    expect(rows.map(([level]) => level)).toEqual([...LEVELS]);
    expect(rows.filter(([, off]) => off === false).every(([, , here]) => /\d/.test(String(here)))).toBe(true);
    await page.click('#lv-pop [data-row="A2"]');
    expect(await levelOf()).toBe("A2");
    expect(await panelOpen("lv-pop")).toBe(false);
  },
  SLOW,
);

test(
  "on a small screen a scroll over the level popover scrolls the popover and leaves the page still",
  async () => {
    await open(390, "/en/english/verbs/to-be/?level=c2");
    await page.evaluate(() => {
      scrollTo(0, 300);
    });
    await page.locator("section.part h2 .lvm-b").first().click();
    expect(await panelOpen("lv-pop")).toBe(true);
    const before = await page.evaluate(() => scrollY);
    const box = await page.locator("#lv-pop").boundingBox();
    await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 200);
    await page.mouse.wheel(0, 3000);
    await settled();
    expect(await page.evaluate(() => scrollY)).toBe(before);
    expect(await page.locator("#lv-pop").evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    // Past its end, the scroll stays in the popover too.
    await page.mouse.wheel(0, 3000);
    await settled();
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await page.keyboard.press("Escape");
  },
  SLOW,
);
