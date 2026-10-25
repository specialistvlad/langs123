// What the browser tests share: one server over the sample site and one Chromium, started once per test
// process on first use, so every *.e2e.ts file run together in one process opens its pages in them. The
// process ends both when its tests are done.
import { type Browser, chromium } from "playwright";
import { served } from "./serve.ts";
import { SITE_DIR, testSite } from "./test-site.ts";

let started: Promise<{ base: URL; browser: Browser }> | undefined;

export function shared(): Promise<{ base: URL; browser: Browser }> {
  started ??= (async () => {
    await testSite();
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      // As a static host serves it, the nearest missing page up the path included (serve.ts).
      fetch: async (req) => {
        const answer = await served(SITE_DIR, decodeURIComponent(new URL(req.url).pathname));
        if (answer.status === 301) return new Response(null, { status: 301, headers: { Location: answer.location } });
        return new Response(Bun.file(answer.file), { status: answer.status });
      },
    });
    server.unref();
    return { base: server.url, browser: await chromium.launch() };
  })();
  return started;
}
