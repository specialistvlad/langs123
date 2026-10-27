// Languages I know on the fixture pages (languages-fixture.ts), where a course and a topic lack a language and the reader
// ranks Українська, English, Polski: the "Explained in" lines, the Home's other courses, the sheet, the topic tags and
// the fallback note.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, expect, test } from "bun:test";
import { at, closeReaders, reader, shows, SLOW } from "./languages-reader.ts";

afterAll(closeReaders);

test(
  "the Home's lines name the first language of the reader's that the course has, a fallback with its mark, and a course with none moves under its own heading",
  async () => {
    const page = await reader(["uk", "en", "pl"], { stored: "uk en pl" });
    await page.goto(at("/uk/fx/home/"));
    const line = (course: string) => page.locator(`.xl-line[data-course="${course}"]`);
    await shows(line("en").locator("b"), "українська");
    expect(await line("en").locator(".xl-fb").count()).toBe(0);
    await shows(line("es").locator("b"), "англійська");
    expect(await line("es").locator(".xl-fb").getAttribute("aria-label")).not.toBe("");
    await shows(line("ja"), "日本語");
    expect(await line("ja").locator("b").count()).toBe(0);
    expect(await page.locator("[data-xl-other-cards] [data-xl-card]").count()).toBe(1);
    expect(await page.locator("[data-xl-other]").isVisible()).toBe(true);
    expect(await page.locator("#hm-cards > [data-xl-card]").count()).toBe(3);
    expect(await page.locator("[data-xl-card].xl-dim").count()).toBe(1);
    expect(await page.locator("a[data-course]").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
      "/uk/english/",
      "/en/spanish/",
      "/en/french/",
      "/pt/japanese/".replace("/pt/", "/ja/"),
    ]);
  },
  SLOW,
);

test(
  "the sheet opens from a line: Follow my languages ticked, the reader's languages with those the course lacks dimmed, the course's others, Languages I know… last",
  async () => {
    const page = await reader(["uk", "en", "pl"], { stored: "uk en pl", width: 402 });
    await page.goto(at("/uk/fx/home/"));
    await page.locator('.xl-line[data-course="fr"]').click();
    const sheet = page.locator("dialog.xl-sheet");
    await sheet.waitFor({ state: "visible" });
    expect(await sheet.locator("h2").textContent()).toBe("Мова пояснень");
    expect(
      await sheet.locator(".xl-row[data-pick]").evaluateAll((rows) => rows.map((r) => (r as HTMLButtonElement).dataset["pick"])),
    ).toEqual(["", "uk", "en", "pl", "pt"]);
    expect(
      await sheet.locator(".xl-row:disabled").evaluateAll((rows) => rows.map((r) => (r as HTMLButtonElement).dataset["pick"])),
    ).toEqual(["uk", "pl"]);
    expect(await sheet.locator('.xl-row[data-pick=""]').getAttribute("aria-pressed")).toBe("true");
    expect(await sheet.locator(".xl-row .xl-tick").count()).toBe(2);
    expect((await sheet.locator(".xl-course").textContent())?.toLowerCase()).toContain("французька");
    const now = (await sheet.locator('.xl-row[data-pick=""] small').textContent())?.toLowerCase() ?? "";
    expect([now.includes("англійська"), now.includes("українськ")]).toEqual([true, true]);
    const edit = sheet.locator(".xl-row:last-child").last();
    expect([await edit.textContent(), await edit.getAttribute("href")]).toEqual(["Мови, які я знаю…", "/uk/languages/"]);
    await sheet.locator(".xl-close").click();
    await sheet.waitFor({ state: "hidden" });
    await page.locator('.xl-line[data-course="fr"]').click();
    await page.keyboard.press("Escape");
    await page.locator("dialog.xl-sheet").waitFor({ state: "detached" });
  },
  SLOW,
);

test(
  "a click opens the sheet focused on itself with no row ringed; from the keyboard the chosen row takes the focus, and each row's ring keeps to its card's corners",
  async () => {
    const page = await reader(["uk", "en", "pl"], { stored: "uk en pl" });
    await page.goto(at("/uk/fx/home/"));
    const line = page.locator('.xl-line[data-course="fr"]');
    const sheet = page.locator("dialog.xl-sheet");
    // What holds the focus (a row's pick, the sheet, or edit for Languages I know…), the rows ringed, the focused row's
    // ring, its corners and its card's
    const focus = () =>
      page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        const s = getComputedStyle(e);
        return {
          at: e.matches("dialog") ? "sheet" : (e.dataset["pick"] ?? "edit"),
          ringed: [...document.querySelectorAll(".xl-row")].filter((r) => r.matches(":focus-visible")).length,
          ring: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineOffset}`,
          corners: [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius],
          card: getComputedStyle(e.parentElement ?? e).borderTopLeftRadius,
        };
      });
    await line.click();
    await sheet.waitFor({ state: "visible" });
    expect(await focus()).toMatchObject({ at: "sheet", ringed: 0 });
    await page.keyboard.press("Escape");
    await sheet.waitFor({ state: "detached" });
    await line.focus();
    await page.keyboard.press("Enter");
    await sheet.waitFor({ state: "visible" });
    const seen = [await focus()];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab");
      seen.push(await focus());
    }
    expect(seen.map((f) => [f.at, f.ringed, f.ring])).toEqual(["", "en", "pt", "edit"].map((pick) => [pick, 1, "2px solid -2px"]));
    // Follow my languages, the other languages' row and Languages I know… are alone in their cards; English sits
    // between two rows
    expect(seen.map((f) => f.corners.map((c) => c === f.card))).toEqual([
      [true, true, true, true],
      [false, false, false, false],
      [true, true, true, true],
      [true, true, true, true],
    ]);
    expect(seen[1]?.corners).toEqual(["0px", "0px", "0px", "0px"]);
  },
  SLOW,
);

test(
  "choosing a language pins it for that course alone; Follow my languages lifts the pin",
  async () => {
    const page = await reader(["uk", "en", "pl"], { stored: "uk en pl" });
    await page.goto(at("/uk/fx/home/"));
    await page.locator('.xl-line[data-course="fr"]').click();
    await page.locator('.xl-row[data-pick="pt"]').click();
    expect(await page.evaluate(() => localStorage.getItem("ln-xl-fr"))).toBe("pt");
    await shows(page.locator('.xl-line[data-course="fr"] b'), "португальська");
    expect(await page.locator('.xl-line[data-course="fr"] .xl-fb').count()).toBe(0);
    expect(await page.locator('a[data-course="fr"]').getAttribute("href")).toBe("/pt/french/");
    expect(await page.locator('.xl-line[data-course="es"] b').textContent()).toBe("англійська");
    await page.locator('.xl-line[data-course="fr"]').click();
    expect(await page.locator('.xl-row[data-pick="pt"]').getAttribute("aria-pressed")).toBe("true");
    await page.locator('.xl-row[data-pick=""]').click();
    await shows(page.locator('.xl-line[data-course="fr"] b'), "англійська");
    expect(await page.locator('a[data-course="fr"]').getAttribute("href")).toBe("/en/french/");
    await page.locator('.xl-line[data-course="ja"]').click();
    await page.locator('.xl-row[data-pick="ja"]').click();
    expect(await page.locator("[data-xl-other-cards] [data-xl-card]").count()).toBe(0);
    expect(await page.locator("[data-xl-other]").isVisible()).toBe(false);
  },
  SLOW,
);

test(
  "on a course page a topic the reader's first language lacks opens in the next one with its code tagged, and choosing leads to the page in the new language",
  async () => {
    const page = await reader(["uk", "en", "pl"], { stored: "uk en pl" });
    await page.goto(at("/uk/fx/course/"));
    const row = (slug: string) => page.locator(`li[data-topic-explains]:has(a[href*="/${slug}/"])`);
    await shows(row("days").locator("[data-xl-tag]"), "EN");
    expect(await row("alphabet").locator("[data-xl-tag]").isHidden()).toBe(true);
    expect(await row("days").locator("a").getAttribute("href")).toBe("/en/fx/f/days/");
    expect(await row("alphabet").locator("a").getAttribute("href")).toBe("/uk/fx/f/alphabet/");
    await page.locator(".xl-line").click();
    await page.locator('.xl-row[data-pick="en"]').click();
    await page.waitForURL(at("/en/fx/course/"));
  },
  SLOW,
);

test(
  "a topic page in a fallback language tags the topic and says why, with Change language opening the sheet",
  async () => {
    const page = await reader(["uk", "en", "pl"], { stored: "uk en pl" });
    await page.goto(at("/uk/fx/topic/"));
    await shows(page.locator("[data-xl-tag]"), "EN");
    const note = page.locator("[data-xl-note]");
    await shows(note, "This topic isn't in Ukrainian yet, so it's in English, the next of your languages.");
    await note.locator(".xl-change").click();
    const sheet = page.locator("dialog.xl-sheet");
    await sheet.waitFor({ state: "visible" });
    await sheet.locator('.xl-row[data-pick="uk"]').click();
    expect(await page.evaluate(() => localStorage.getItem("ln-xl-en"))).toBe("uk");
    expect(new URL(page.url()).pathname).toBe("/uk/fx/topic/");
    await shows(note, "Ukrainian");
  },
  SLOW,
);

test(
  "a topic that has the first language shows no tag and no note",
  async () => {
    const page = await reader(["en", "uk"], { stored: "en uk" });
    await page.goto(at("/uk/fx/topic/"));
    await page.waitForFunction(() => document.querySelector("[data-xl-note]") !== null);
    await page.waitForTimeout(300);
    expect(await page.locator("[data-xl-note]").isHidden()).toBe(true);
    expect(await page.locator("[data-xl-tag]").isHidden()).toBe(true);
  },
  SLOW,
);
