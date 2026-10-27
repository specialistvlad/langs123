// The Explanation language sheet on opening: where the focus lands after a click or a key, how a row's ring keeps to
// its card, and a tap made before the wording arrives.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, expect, test } from "bun:test";
import { at, closeReaders, reader, SLOW } from "./languages-reader.ts";

afterAll(closeReaders);

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
  "on a slow connection a tap on 文A before the wording arrives opens the sheet once it does, and two taps open it once",
  async () => {
    const page = await reader(["en"], { stored: "en", width: 402, touch: true });
    // The wording waits until the test lets it through
    let release = (): void => undefined;
    await page.route("**/languages.json", async (route) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await route.continue();
    });
    const sheets = page.locator("dialog.xl-sheet");
    for (const taps of [1, 2]) {
      const asked = page.waitForRequest("**/languages.json");
      await page.goto(at("/en/english/"));
      await asked;
      for (let i = 0; i < taps; i++) await page.locator(".cl-langs").tap();
      expect(await sheets.count()).toBe(0);
      release();
      await sheets.waitFor({ state: "visible" });
      expect([taps, await sheets.count(), await sheets.locator(".xl-edit").getAttribute("href")]).toEqual([taps, 1, "/languages/"]);
    }
  },
  SLOW,
);
