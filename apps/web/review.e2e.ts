// The review preview in a browser, over the samples built as a v1 preview builds them: the queue leads to a draft, which
// reads in the language the address names with each of its findings pinned under its element.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, expect, test } from "bun:test";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { shared } from "./browser.ts";
import { build } from "./build.ts";
import { SAMPLE } from "./sample.ts";
import { served } from "./serve.ts";
import { SITE_DIR } from "./test-site.ts";

const DIR = `${SITE_DIR}-review`;
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
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
afterAll(async () => {
  await page.close();
  await server.stop(true);
});

test("the queue leads to a draft, which reads in the language the address names with its findings pinned", async () => {
  await page.goto(new URL("/review/", server.url).href);
  expect(await page.locator(".rv .lx-irow a").count()).toBe(4);
  await page.locator('.rv a[href="/review/en.present-simple/"]').click();
  await page.locator("#rv .rd-seg").waitFor();
  expect(await page.locator('#rv .rd-seg [aria-selected="true"]').textContent()).toBe("English");
  const source = await page.locator("#rv .rv-pins .rv-fc").count();
  await page.locator('#rv .rd-seg [data-lang="ja"]').click();
  expect(page.url()).toEndWith("?lang=ja");
  expect(await page.locator('#rv .rd-seg [aria-selected="true"]').textContent()).toBe("Japanese");
  expect(await page.locator("#rv-title").textContent()).not.toBe("");
  expect(await page.locator("#rv .rv-pins .rv-fc").count()).toBeGreaterThanOrEqual(source);
  expect(await page.locator("#rv .rv-rest").count()).toBe(0);
}, 30_000);
