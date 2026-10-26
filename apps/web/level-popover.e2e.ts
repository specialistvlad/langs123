// The level popover in a browser: a level mark opens it with the element's name, bars and range and seven levels,
// those the element lacks dimmed, and a choice that sets the level; on a phone it is a sheet with a close button, and
// a scroll over it scrolls the sheet and leaves the page still.
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

async function open(width: number, address: string, height = 800): Promise<void> {
  await page.setViewportSize({ width, height });
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

// The levels a mark lights, lowest first.
const litBy = (selector: string): Promise<string[]> =>
  page.$$eval(`${selector} i.on`, (bars) => bars.map((bar) => [...bar.classList].find((c) => c.startsWith("lv-"))?.slice(3) ?? ""));

test(
  "a level mark opens the popover: the element's name, its bars and range, seven levels, and a choice that sets the level",
  async () => {
    await open(1600, "/en/english/verbs/to-be/?level=c2");
    const held = await litBy(".doc-head .lvm-b");
    await page.click(".doc-head .lvm-b");
    expect(await panelOpen("lv-pop")).toBe(true);
    expect(await page.locator("#lv-pop .lv-pop-t").textContent()).toBe("To be");
    expect(await litBy("#lv-pop .lv-pop-m")).toEqual(held);
    const range = await page.$$eval("#lv-pop .lv-pop-r .half", (els) => els.map((el) => el.textContent));
    expect(range).toEqual([...new Set([held[0] ?? "", held.at(-1) ?? ""])]);
    // Seven rows; the levels the topic lacks below the top one dim and have no choice behind them, the top one (All
    // levels) staying active; no per-level lines.
    const rows = await page.$$eval("#lv-pop .lv-row", (els) =>
      els.map((el) => [el.getAttribute("data-row"), el.classList.contains("lv-off"), el.getAttribute("data-set-level")]),
    );
    expect(rows.map(([level]) => level)).toEqual([...LEVELS]);
    expect(rows.map(([level, off]) => [level, off])).toEqual(LEVELS.map((level) => [level, !held.includes(level) && level !== "C2"]));
    expect(rows.every(([level, off, set]) => (off === true ? set === null : set === level))).toBe(true);
    expect(await page.locator("#lv-pop .lv-here").count()).toBe(0);
    expect(await page.locator("#lv-pop .lv-pop-x").isHidden()).toBe(true);
    // With no level chosen the top row is ticked; choosing a level the topic holds sets it and closes the popover.
    expect(await page.locator('#lv-pop [data-row="C2"]').getAttribute("aria-checked")).toBe("true");
    const choice = held.find((level) => level !== "C2") ?? "";
    await page.click(`#lv-pop [data-row="${choice}"]`);
    expect(await levelOf()).toBe(choice);
    expect(await panelOpen("lv-pop")).toBe(false);
    await page.click(".doc-head .lvm-b");
    expect(await page.locator(`#lv-pop [data-row="${choice}"]`).getAttribute("aria-checked")).toBe("true");
    expect(await page.locator('#lv-pop [data-row="C2"]').getAttribute("aria-checked")).toBe("false");
    // A dimmed row cannot be chosen; Escape closes the popover.
    const lacking = LEVELS.find((level) => !held.includes(level));
    if (lacking !== undefined) {
      await page.click(`#lv-pop [data-row="${lacking}"]`, { force: true });
      expect(await levelOf()).toBe(choice);
      expect(await panelOpen("lv-pop")).toBe(true);
    }
    await page.keyboard.press("Escape");
    expect(await panelOpen("lv-pop")).toBe(false);
  },
  SLOW,
);

test(
  "on a wide screen the popover opens under its mark and shifts up to end inside the window, whatever the mark's height",
  async () => {
    await open(1440, "/en/english/", 1200);
    const marks = page.locator(".ix-row .lvm-b:visible");
    const edges = async (): Promise<{ top: number; bottom: number }> => {
      await settled();
      const box = await page.locator("#lv-pop").boundingBox();
      return { top: box?.y ?? 0, bottom: (box?.y ?? 0) + (box?.height ?? 0) };
    };
    // A mark near the top: the popover sits under it.
    await marks.nth(1).click();
    const high = await marks.nth(1).boundingBox();
    const under = await edges();
    expect(Math.round(under.top)).toBe(Math.round((high?.y ?? 0) + (high?.height ?? 0) + 8));
    await page.keyboard.press("Escape");
    // A window too short to leave room under the mark: the popover ends at the window's bottom and stays whole.
    await page.setViewportSize({ width: 1440, height: 900 });
    const low = marks.nth(1);
    await low.click();
    const shifted = await edges();
    expect(Math.round(shifted.bottom)).toBe(900);
    expect(shifted.top).toBeLessThan(under.top);
    expect(await page.locator("#lv-pop").evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    await page.keyboard.press("Escape");
    // A window shorter than the popover: it fills the window and scrolls.
    await page.setViewportSize({ width: 1440, height: 400 });
    await low.click();
    const short = await edges();
    expect([Math.round(short.top), Math.round(short.bottom)]).toEqual([12, 400]);
    expect(await page.locator("#lv-pop").evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await page.keyboard.press("Escape");
  },
  SLOW,
);

test(
  "on a phone the popover is a sheet 8px from the edges with a close button, and the page holds still behind it",
  async () => {
    await open(390, "/en/english/verbs/to-be/?level=c2");
    await page.locator("section.part h2 .lvm-b").first().click();
    expect(await panelOpen("lv-pop")).toBe(true);
    const box = await page.locator("#lv-pop").boundingBox();
    expect([box?.x, Math.round((box?.x ?? 0) + (box?.width ?? 0)), Math.round((box?.y ?? 0) + (box?.height ?? 0))]).toEqual([8, 382, 792]);
    expect(await page.locator("#lv-pop .lv-pop-x").isVisible()).toBe(true);
    expect(await page.locator("#lv-pop .lv-pop-x").getAttribute("aria-label")).toBe("Close");
    await page.click("#lv-pop .lv-pop-x");
    expect(await panelOpen("lv-pop")).toBe(false);
  },
  SLOW,
);

test(
  "on a small screen a scroll over the level popover scrolls the popover and leaves the page still",
  async () => {
    await open(390, "/en/english/verbs/to-be/?level=c2", 480);
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
