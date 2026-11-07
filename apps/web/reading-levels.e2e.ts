// The level popover on a page of the new library's reading (pages/reading.ts, level-popover.ts): the head's level mark opens
// it with the topic's name and the levels its parts hold, and part 00's mark with its own name (M9).
// Run: npm run e2e
import { afterAll, expect, test } from "bun:test";
import type { BrowserContext } from "playwright";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { shared } from "./browser.ts";
import { build } from "./build.ts";
import { SAMPLE } from "./sample.ts";
import { served } from "./serve.ts";
import { SITE_DIR } from "./test-site.ts";

const DIR = `${SITE_DIR}-reading-levels`;
await build({ outDir: DIR, dev: true, siteUrl: "http://127.0.0.1", sample: SAMPLE, library: "v1", root: SAMPLES_ROOT });
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: async (req) => {
    const answer = await served(DIR, decodeURIComponent(new URL(req.url).pathname));
    if (answer.status === 301) return new Response(null, { status: 301, headers: { Location: answer.location } });
    return new Response(Bun.file(answer.file), { status: answer.status });
  },
});
const { browser } = await shared();
const contexts: BrowserContext[] = [];
afterAll(async () => {
  for (const c of contexts) await c.close();
  await server.stop(true);
});

test("the head's level mark opens the level popover with the topic's name and its levels, and part 00's names the part", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  contexts.push(context);
  const page = await context.newPage();
  await page.goto(new URL("/uk/english/v1/present-simple/", server.url).href);
  await page.locator("#rd .rd-form").waitFor();
  await page.locator("#rd .rd-head .lx-ladder").click();
  await page.locator("#lv-pop:popover-open").waitFor();
  expect(await page.locator("#lv-pop .lv-pop-t").textContent()).toBe("Present Simple");
  expect(await page.locator("#lv-pop .lv-pop-m i.on").count()).toBe(2);
  await page.keyboard.press("Escape");
  await page.locator("#rd #essence .lx-ladder").click();
  await page.locator("#lv-pop:popover-open").waitFor();
  expect(await page.locator("#lv-pop .lv-pop-t").textContent()).toBe("Суть");
}, 30_000);
