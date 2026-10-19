// What the browser tests share: one server over the sample site and one Chromium, started once per test
// process on first use, so every *.e2e.ts file run together in one process opens its pages in them. The
// process ends both when its tests are done.
import { join } from "node:path";
import { type Browser, chromium } from "playwright";
import { SITE_DIR, testSite } from "./test-site.ts";

let started: Promise<{ base: URL; browser: Browser }> | undefined;

export function shared(): Promise<{ base: URL; browser: Browser }> {
  started ??= (async () => {
    await testSite();
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: (req) => {
        const path = decodeURIComponent(new URL(req.url).pathname);
        return new Response(Bun.file(join(SITE_DIR, path.endsWith("/") ? `${path}index.html` : path)));
      },
    });
    server.unref();
    return { base: server.url, browser: await chromium.launch() };
  })();
  return started;
}
