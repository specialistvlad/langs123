// The Variety switch in a browser: a page of a language with varieties opens on the default and shows
// its elements with those of every variety; choosing another shows that variety's elements instead,
// carries the choice in the address and keeps it for the next page; the address wins over the kept
// choice; a page without scripts shows the default; switching moves no column of a table, the rows of
// the other variety lie flat, and a cell with variants reads as the chosen variety's plain text.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
const TOPIC = "/en/spanish/ser-estar-hay-gustar/ser-estar/";

// A fresh page with storage of its own, so each test starts from the first visit.
async function fresh(scripts = true): Promise<Page> {
  const context = await browser.newContext({ javaScriptEnabled: scripts });
  return context.newPage();
}
const url = (path: string): string => new URL(path, base).href;
// Whether the page shows any element of a variety, and the variety <html> names.
const shows = (page: Page, variety: string): Promise<boolean> =>
  page.$$eval(`main [data-variety="${variety}"]`, (els) => els.some((el) => el.checkVisibility({ visibilityProperty: true })));
const chosen = (page: Page): Promise<string | undefined> => page.evaluate(() => document.documentElement.dataset["variety"]);
// Chooses a variety in the menu its button in the top bar opens.
async function choose(page: Page, variety: string): Promise<void> {
  await page.click('.tp-top [popovertarget="ix-varieties"]');
  await page.click(`#ix-varieties [data-set-variety="${variety}"]`);
}

test(
  "a page opens on Latin America and shows its elements alone",
  async () => {
    const page = await fresh();
    await page.goto(url(TOPIC));
    expect(await chosen(page)).toBe("es-419");
    expect(await shows(page, "es-419")).toBe(true);
    expect(await shows(page, "es-ES")).toBe(false);
    expect(await page.$eval('[data-set-variety="es-419"]', (b) => b.getAttribute("aria-checked"))).toBe("true");
    await page.context().close();
  },
  SLOW,
);

test(
  "choosing Spain shows its elements, carries it in the address and keeps it for the next page",
  async () => {
    const page = await fresh();
    await page.goto(url(TOPIC));
    await choose(page, "es-ES");
    expect(await chosen(page)).toBe("es-ES");
    expect(await shows(page, "es-ES")).toBe(true);
    expect(await shows(page, "es-419")).toBe(false);
    expect(new URL(page.url()).searchParams.get("variety")).toBe("es-es");
    await page.goto(url("/es/spanish/"));
    expect(await chosen(page)).toBe("es-ES");
    await page.goto(url(`${TOPIC}?variety=es-419`));
    expect(await chosen(page)).toBe("es-419");
    expect(await shows(page, "es-ES")).toBe(false);
    await page.context().close();
  },
  SLOW,
);

test(
  "a page without scripts shows Latin America",
  async () => {
    const page = await fresh(false);
    await page.goto(url(TOPIC));
    expect(await shows(page, "es-419")).toBe(true);
    expect(await shows(page, "es-ES")).toBe(false);
    await page.context().close();
  },
  SLOW,
);

// The place of every header cell of the page's tables, and the height of each row of another variety.
const layout = (page: Page): Promise<{ columns: string[]; others: number[] }> =>
  page.evaluate(() => {
    const current = document.documentElement.dataset["variety"];
    const columns = [...document.querySelectorAll("main table")].map((t) =>
      [...t.querySelectorAll("th")]
        .map((th) => `${Math.round(th.getBoundingClientRect().x)}+${Math.round(th.getBoundingClientRect().width)}`)
        .join(" "),
    );
    const others = [...document.querySelectorAll("main tr[data-variety]")]
      .filter((tr) => tr.getAttribute("data-variety") !== current)
      .map((tr) => tr.getBoundingClientRect().height);
    return { columns, others };
  });
// The text a table cell shows: the copy in the chosen variety where it holds one per variety.
const cellText = (page: Page, cell: string): Promise<string> =>
  page.$eval(cell, (td) =>
    [...td.querySelectorAll(".cell-variety")]
      .filter((c) => c.checkVisibility({ visibilityProperty: true }))
      .map((c) => c.textContent)
      .join(""),
  );

test.each([
  ["/en/spanish/fundamentos/alfabeto-ortografia/", false],
  ["/en/spanish/presente/presente-regular/", true],
])(
  "switching the variety on %s keeps every column in place and the other variety's rows flat",
  async (path, rows) => {
    const page = await fresh();
    await page.goto(url(`${path}?view=extended`));
    const latam = await layout(page);
    await choose(page, "es-ES");
    const spain = await layout(page);
    expect(spain.columns).toEqual(latam.columns);
    expect(latam.others.length > 0).toBe(rows);
    expect([...latam.others, ...spain.others].every((h) => h < 1)).toBe(true);
    await page.context().close();
  },
  SLOW,
);

test(
  "a cell with variants reads as the chosen variety's plain text",
  async () => {
    const page = await fresh();
    const v = 'tr[data-value="v"] td:nth-child(2)';
    const summary = 'xpath=//section[contains(@class, "summary")]//tr[td[1][normalize-space(.)="v and w"]]/td[2]';
    // A section holds the table, the summary its line.
    const topic = "/en/spanish/fundamentos/alfabeto-ortografia/";
    await page.goto(url(topic));
    expect(await cellText(page, v)).toBe("ve");
    expect(await cellText(page, summary)).toBe("v is called ve, and w doble u");
    await choose(page, "es-ES");
    expect(await cellText(page, summary)).toBe("v is called uve, and w uve doble");
    expect(await cellText(page, v)).toBe("uve");
    await page.context().close();
  },
  SLOW,
);
