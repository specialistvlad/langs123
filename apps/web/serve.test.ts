// How the built site answers an address, as a static host serves it: a missing address takes the missing page of its
// language, however deep it sits, and every other the site's own; a folder answers with its index and moves to its
// slash; a file answers as itself; an address above the site takes the site's missing page.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { ENABLED_EXPLAIN } from "../../scripts/lib.ts";
import { served } from "./serve.ts";
import { SITE_DIR, testSite } from "./test-site.ts";
import { notFoundUrl } from "./urls.ts";

await testSite();
const page = (url: string): string => join(SITE_DIR, `${url.slice(1)}${url.endsWith("/") ? "index.html" : ""}`);

test.each([...ENABLED_EXPLAIN])("a missing address under %s takes that language's missing page, however deep", async (e) => {
  const root = e === ENABLED_EXPLAIN[0] ? "" : `/${e}`;
  for (const address of [`${root}/no-such-page/`, `${root}/english/no-such-topic/`, `${root}/a/b/c/d`]) {
    expect([address, await served(SITE_DIR, address)]).toEqual([address, { file: page(notFoundUrl(e)), status: 404 }]);
  }
});

test("a folder answers with its index, and asked for without its slash moves to it; a file answers as itself", async () => {
  expect(await served(SITE_DIR, "/en/english/")).toEqual({ file: join(SITE_DIR, "en/english/index.html"), status: 200 });
  expect(await served(SITE_DIR, "/en/english")).toEqual({ location: "/en/english/", status: 301 });
  expect(await served(SITE_DIR, "/style.css")).toEqual({ file: join(SITE_DIR, "style.css"), status: 200 });
});

test("an address above the site, or none of a language, takes the site's own missing page", async () => {
  for (const address of ["/../outside", "/xx/no-such-page/"]) {
    expect([address, await served(SITE_DIR, address)]).toEqual([address, { file: join(SITE_DIR, "404.html"), status: 404 }]);
  }
});
