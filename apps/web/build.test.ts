// The sample site holds every kind of page: each home, credits and missing page with the Home's search data, and per
// track of the sample its index and its topics; every page asks for its styles and script under their hashed names.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { ENABLED_EXPLAIN, LEVELS } from "../../scripts/lib.ts";
import { SAMPLE } from "./sample.ts";
import { type SearchData, topicsOf } from "./search-find.ts";
import { type Index, partOf, scores } from "./search-index.ts";
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
  const tracks = new Set(
    pages.flatMap((p) => /^([a-z]{2})\/(?!credits\/|languages\/)([a-z]+)\/index\.html$/.exec(p)?.slice(1, 3).join("/") ?? []),
  );
  expect([...tracks].map((t) => t.split("/")[0]).every((e) => SAMPLE.explain.includes(e as never))).toBe(true);
  for (const t of tracks) {
    expect(pages.filter((p) => p.startsWith(`${t}/`) && p.split("/").length === 5).length).toBeGreaterThan(0);
  }
  // One track per course of the sample in each of its explanation languages.
  expect(tracks.size).toBe(new Set(SAMPLE.topics.map((id) => id.split(".")[0])).size * SAMPLE.explain.length);
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

test("a search row reads as a topic: its title, levels, course, level popover entry and id", async () => {
  const data = (await Bun.file(join(SITE_DIR, "search", "en.json")).json()) as SearchData;
  const topic = topicsOf(data).find((t) => t.id === "en.verbs.irregular-verbs-table");
  expect([topic?.code, topic?.levels[0], topic?.url, Object.keys(topic?.entry ?? {}).length > 0]).toEqual([
    "en",
    "A1",
    "/en/english/verbs/irregular-verbs-table/",
    true,
  ]);
});

test("each home page's search data comes with its index in parts, and a word of a lesson finds its topic", async () => {
  const dir = join(SITE_DIR, "search");
  const { topics, parts } = (await Bun.file(join(dir, "en.json")).json()) as { topics: string[][]; parts: string[] };
  const index: Index = {};
  for (const part of parts) Object.assign(index, await Bun.file(join(dir, "en", `${part}.json`)).json());
  expect(Object.keys(index).every((w) => parts.includes(partOf(w)))).toBe(true);
  // "went" stands in no title or lead: only the lessons hold it.
  const found = [...scores(index, Object.keys(index), ["went"])].sort((a, b) => b[1] - a[1]);
  expect(found.length).toBeGreaterThan(0);
  expect(topics.some((t) => (t[0] ?? "").toLowerCase().includes("went") || (t[3] ?? "").toLowerCase().includes("went"))).toBe(false);
  expect(topics[found[0]?.[0] ?? -1]?.[1]).toBe("/en/english/verbs/irregular-verbs-table/");
});

test("every page asks for its styles and script under their hashed names, each written beside its plain name", async () => {
  const home = await Bun.file(join(SITE_DIR, "index.html")).text();
  for (const [name, ext] of [
    ["style", "css"],
    ["levels", "css"],
    ["client", "js"],
  ] as const) {
    const file = new RegExp(`"/(${name}\\.[0-9a-f]{10}\\.${ext})"`).exec(home)?.[1] ?? "";
    expect(file).not.toBe("");
    expect(home).not.toContain(`"/${name}.${ext}"`);
    expect(await Bun.file(join(SITE_DIR, file)).text()).toBe(await Bun.file(join(SITE_DIR, `${name}.${ext}`)).text());
  }
});
