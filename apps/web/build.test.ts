// The sample site holds every kind of page: each home, credits and missing page, and per track of the sample
// its index, its topics, its cheatsheets and its search data.
import { expect, test } from "bun:test";
import { ENABLED_EXPLAIN } from "../../scripts/lib.ts";
import { SAMPLE } from "./sample.ts";
import { testSite } from "./test-site.ts";

const pages = await testSite();

test("every explanation language has its home, credits and missing page", () => {
  for (const e of ENABLED_EXPLAIN) {
    const root = e === ENABLED_EXPLAIN[0] ? "" : `${e}/`;
    expect(pages).toContain(`${root}index.html`);
    expect(pages).toContain(`${root}credits/index.html`);
    expect(pages).toContain(`${root}404.html`);
  }
});

test("each track of the sample has its index, topics and cheatsheets, in the sample's explanation languages only", () => {
  const tracks = new Set(pages.flatMap((p) => /^([a-z]{2})\/(?!credits\/)([a-z]+)\/index\.html$/.exec(p)?.slice(1, 3).join("/") ?? []));
  expect([...tracks].map((t) => t.split("/")[0]).every((e) => SAMPLE.explain.includes(e as never))).toBe(true);
  for (const t of tracks) {
    expect(pages.some((p) => p.startsWith(`${t}/cheatsheets/`))).toBe(true);
    expect(pages.filter((p) => p.startsWith(`${t}/`) && !p.includes("/cheatsheets/") && p.split("/").length === 5).length).toBeGreaterThan(
      0,
    );
  }
  expect(tracks.size).toBe(9);
});
