// What the browser tests of the languages share: a reader whose browser prefers some languages, on the pages of the
// shared site and the fixture pages (languages-fixture.ts).
import type { BrowserContext, Locator, Page } from "playwright";
import { shared } from "./browser.ts";
import { COURSE, HOME, TOPIC } from "./languages-fixture.ts";

const { base, browser } = await shared();
export const SLOW = 30_000;
const contexts: BrowserContext[] = [];
export const closeReaders = (): Promise<unknown> => Promise.all(contexts.map((c) => c.close()));

// A reader whose browser prefers these languages; `automated: false` hides the browser's automation flag, which
// keeps the first visit's redirect from running in test browsers, and `touch` gives it a touch screen.
export async function reader(
  languages: string[],
  o: { stored?: string; automated?: boolean; width?: number; touch?: boolean } = {},
): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: o.width ?? 1032, height: 900 }, hasTouch: o.touch === true });
  contexts.push(context);
  await context.addInitScript(
    ([langs, stored, automated]) => {
      Object.defineProperty(navigator, "languages", { get: () => langs });
      if (automated === false) Object.defineProperty(navigator, "webdriver", { get: () => false });
      try {
        if (stored !== "" && sessionStorage.getItem("seeded") === null) {
          localStorage.setItem("ln-langs", stored);
          sessionStorage.setItem("seeded", "1");
        }
      } catch {
        // No storage in this page.
      }
    },
    [languages, o.stored ?? "", o.automated] as const,
  );
  const page = await context.newPage();
  const fixtures: Record<string, string> = { home: HOME, course: COURSE, topic: TOPIC };
  await page.route("**/fx/*/", (route) =>
    route.fulfill({ contentType: "text/html", body: fixtures[/fx\/(\w+)\//.exec(route.request().url())?.[1] ?? ""] ?? "" }),
  );
  return page;
}
export const at = (path: string): string => new URL(path, base).href;

// A locator's text holds the text, once the page has written it.
export async function shows(locator: Locator, text: string): Promise<void> {
  await locator.filter({ hasText: text }).first().waitFor({ timeout: 5000 });
}
