// The sample site holds every kind of page: each home, credits and missing page with the Home's search data, and per
// track of the sample its index and its topics.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { ENABLED_EXPLAIN, LEVELS } from "../../scripts/lib.ts";
import { SAMPLE } from "./sample.ts";
import { SITE_DIR, testSite } from "./test-site.ts";

const pages = await testSite();

test("every explanation language has its home, credits and missing page", () => {
  for (const e of ENABLED_EXPLAIN) {
    const root = e === ENABLED_EXPLAIN[0] ? "" : `${e}/`;
    expect(pages).toContain(`${root}index.html`);
    expect(pages).toContain(`${root}credits/index.html`);
    expect(pages).toContain(`${root}404.html`);
  }
});

test("each track of the sample has its index and topics, in the sample's explanation languages only", () => {
  const tracks = new Set(pages.flatMap((p) => /^([a-z]{2})\/(?!credits\/)([a-z]+)\/index\.html$/.exec(p)?.slice(1, 3).join("/") ?? []));
  expect([...tracks].map((t) => t.split("/")[0]).every((e) => SAMPLE.explain.includes(e as never))).toBe(true);
  for (const t of tracks) {
    expect(pages.filter((p) => p.startsWith(`${t}/`) && p.split("/").length === 5).length).toBeGreaterThan(0);
  }
  expect(tracks.size).toBe(9);
});

test("each home page has its search data: every topic of the sample with its course, the courses not written for its language opening in their first", async () => {
  const { levels: scale, topics } = (await Bun.file(join(SITE_DIR, "search", "uk.json")).json()) as {
    levels: string[];
    topics: string[][];
  };
  expect(scale).toEqual([...LEVELS]);
  expect(topics.length).toBe(SAMPLE.topics.length);
  const [title, url, levels, , , flag, , other, lang] = topics[0] ?? [];
  expect([
    title !== "",
    url?.startsWith("/uk/"),
    (levels ?? "").split(" ").every((l) => scale.includes(l)),
    flag !== "",
    other,
    lang,
  ]).toEqual([true, true, true, true, "", "uk"]);
});
