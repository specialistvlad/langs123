// Languages I know in a browser: the page's list from the browser's languages, reordering with the keyboard and the
// pointer, adding and removing, the first run and the one visit that leads to it; then, on the fixture pages
// (languages-fixture.ts) where a course and a topic lack a language and the reader ranks Українська, English,
// Polski, the "Explained in" lines, the Home's other courses, the sheet, the topic tags and the fallback note.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { at, closeReaders, reader, SLOW } from "./languages-reader.ts";

afterAll(closeReaders);
const ranked = (page: Page): Promise<(string | null)[]> =>
  page.locator("[data-ml-ranked] .ml-row").evaluateAll((rows) => rows.map((r) => r.getAttribute("data-lang")));
const others = (page: Page): Promise<(string | null)[]> =>
  page.locator("[data-ml-others] .ml-row").evaluateAll((rows) => rows.map((r) => r.getAttribute("data-lang")));
const stored = (page: Page): Promise<string | null> => page.evaluate(() => localStorage.getItem("ln-langs"));

test(
  "the page starts from the browser's languages, an unknown one left out, at most three",
  async () => {
    const page = await reader(["uk-UA", "ko-KR", "en-GB", "pl", "es"]);
    await page.goto(at("/uk/languages/"));
    expect(await ranked(page)).toEqual(["uk", "en", "pl"]);
    expect(await page.locator("[data-ml-ranked] .ml-rank").allTextContents()).toEqual(["1", "2", "3"]);
    expect((await others(page)).slice(0, 2)).toEqual(["es", "pt"]);
    expect(await stored(page)).toBeNull();
  },
  SLOW,
);

test(
  "with three languages Add is unavailable; removing one makes it available, and the list keeps its place",
  async () => {
    const page = await reader(["uk", "en", "pl"]);
    await page.goto(at("/uk/languages/"));
    expect(await page.locator(".ml-add:not([disabled])").count()).toBe(0);
    await page.locator('.ml-row[data-lang="en"] .ml-remove').click();
    expect([await ranked(page), await stored(page)]).toEqual([["uk", "pl"], "uk pl"]);
    expect(await page.locator("[data-ml-ranked] .ml-rank").allTextContents()).toEqual(["1", "2"]);
    await page.locator('.ml-row[data-lang="es"] .ml-add').click();
    expect(await ranked(page)).toEqual(["uk", "pl", "es"]);
    expect(await page.locator(".ml-add:not([disabled])").count()).toBe(0);
    await page.reload();
    expect(await ranked(page)).toEqual(["uk", "pl", "es"]);
    expect((await others(page)).slice(0, 2)).toEqual(["en", "pt"]);
  },
  SLOW,
);

test(
  "the last language cannot be removed",
  async () => {
    const page = await reader(["uk"]);
    await page.goto(at("/uk/languages/"));
    expect(await page.locator("[data-ml-ranked] .ml-remove").isDisabled()).toBe(true);
    expect(await page.locator("[data-ml-ranked] .ml-grip").isDisabled()).toBe(true);
  },
  SLOW,
);

test(
  "the arrow keys on a row's handle move it, the number follows and the order is kept",
  async () => {
    const page = await reader(["uk", "en", "pl"]);
    await page.goto(at("/uk/languages/"));
    const grip = page.locator('.ml-row[data-lang="pl"] .ml-grip');
    await grip.focus();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    expect(await ranked(page)).toEqual(["pl", "uk", "en"]);
    expect(await grip.evaluate((g) => document.activeElement === g)).toBe(true);
    expect(await page.locator('.ml-row[data-lang="pl"] .ml-rank').textContent()).toBe("1");
    expect(await page.locator('.ml-row[data-lang="pl"] .ml-rank').getAttribute("class")).toContain("ml-1");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    expect([await ranked(page), await stored(page)]).toEqual([["uk", "en", "pl"], "uk en pl"]);
  },
  SLOW,
);

test(
  "dragging a row's handle with the pointer moves the row past its neighbours",
  async () => {
    const page = await reader(["uk", "en", "pl"]);
    await page.goto(at("/uk/languages/"));
    const first = await page.locator('.ml-row[data-lang="uk"] .ml-grip').boundingBox();
    const last = await page.locator('.ml-row[data-lang="pl"]').boundingBox();
    if (first === null || last === null) throw new Error("rows are not on the page");
    const x = first.x + first.width / 2;
    await page.mouse.move(x, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, first.y + first.height / 2 + 30, { steps: 4 });
    expect(await page.locator('.ml-row[data-lang="uk"]').getAttribute("class")).toContain("ml-lift");
    await page.mouse.move(x, last.y + last.height + 4, { steps: 10 });
    expect(await ranked(page)).toEqual(["en", "pl", "uk"]);
    await page.mouse.up();
    expect(await page.locator('.ml-row[data-lang="uk"]').getAttribute("class")).not.toContain("ml-lift");
    expect([await ranked(page), await stored(page)]).toEqual([["en", "pl", "uk"], "en pl uk"]);
    const grip = await page.locator('.ml-row[data-lang="uk"] .ml-grip').boundingBox();
    const top = await page.locator('.ml-row[data-lang="en"]').boundingBox();
    if (grip === null || top === null) throw new Error("rows are not on the page");
    await page.mouse.move(x, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, top.y - 10, { steps: 12 });
    await page.mouse.up();
    expect((await ranked(page))[0]).toBe("uk");
  },
  SLOW,
);

test(
  "the first run keeps the list at once and Continue goes back to where the reader was, else to the first language's Home",
  async () => {
    const page = await reader(["uk-UA", "en"]);
    await page.goto(at("/uk/languages/first/?back=/uk/credits/"));
    expect(await stored(page)).toBe("uk en");
    await page.locator("[data-ml-continue]").click();
    await page.waitForURL(at("/uk/credits/"));
    await page.goto(at("/uk/languages/first/"));
    await page.locator('.ml-row[data-lang="en"] .ml-grip').focus();
    await page.keyboard.press("ArrowUp");
    await page.locator("[data-ml-continue]").click();
    await page.waitForURL(at("/"));
    await page.goto(at("/uk/languages/first/?back=//evil.example/"));
    await page.locator("[data-ml-continue]").click();
    await page.waitForURL(at("/"));
  },
  SLOW,
);

test(
  "a first visit goes once to the first run, in the first language, and back to the page it asked for",
  async () => {
    const page = await reader(["uk-UA", "en"], { automated: false });
    await page.goto(at("/credits/"));
    await page.waitForURL(/\/uk\/languages\/first\/\?back=%2Fcredits%2F$/);
    await page.locator("[data-ml-continue]").click();
    await page.waitForURL(at("/credits/"));
    await page.goto(at("/uk/credits/"));
    expect(new URL(page.url()).pathname).toBe("/uk/credits/");
  },
  SLOW,
);

test(
  "a first visit to a Home goes to the Home of the reader's first language once the list is set",
  async () => {
    const page = await reader(["uk-UA", "en"], { automated: false });
    await page.goto(at("/"));
    await page.waitForURL(at("/uk/languages/first/"));
    await page.locator("[data-ml-continue]").click();
    await page.waitForURL(at("/uk/"));
  },
  SLOW,
);

test(
  "an automated browser, a reader whose list is kept and a page without the list's needs are not sent to the first run",
  async () => {
    const automated = await reader(["uk"]);
    await automated.goto(at("/credits/"));
    await automated.waitForTimeout(400);
    expect(new URL(automated.url()).pathname).toBe("/credits/");
    const kept = await reader(["uk"], { automated: false, stored: "en" });
    await kept.goto(at("/uk/credits/"));
    await kept.waitForTimeout(400);
    expect(new URL(kept.url()).pathname).toBe("/uk/credits/");
  },
  SLOW,
);
