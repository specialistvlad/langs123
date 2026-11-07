// The build reads the library it is given: with "v1" it writes today's pages as they are and, beside them in data/v1/,
// the new library's export of the fixture library, its approved topics alone, and every draft too in dev (RV-03), with one
// layer file per topic and language beside the course file (7.4).
import { afterAll, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { CourseFile, LibraryFile } from "../../scripts/generated/export-v1.ts";
import { fixture, SOURCE, write } from "../../scripts/v1/fixture.ts";
import { build, libraryArg, rootArg, V1_DATA } from "./build.ts";
import { SAMPLE } from "./sample.ts";
import { SITE_DIR, testSite } from "./test-site.ts";

const V1_DIR = `${SITE_DIR}-v1`;
const DEV_DIR = `${SITE_DIR}-v1-dev`;
const { files, topic } = fixture();
const root = await write(files);
await testSite();
await build({ outDir: V1_DIR, dev: false, siteUrl: "http://127.0.0.1", sample: SAMPLE, library: "v1", root });
await build({ outDir: DEV_DIR, dev: true, siteUrl: "http://127.0.0.1", sample: SAMPLE, library: "v1", root });

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const list = (dir: string): Promise<string[]> => Array.fromAsync(new Bun.Glob("**/*").scan({ cwd: dir })).then((f) => f.sort());
const json = <T>(dir: string, file: string): Promise<T> => Bun.file(join(dir, V1_DATA, file)).json() as Promise<T>;

test("the fixture's topic is a draft, so the export below tells the approved from the drafts", () => {
  expect(SOURCE.status).toBe("draft");
});

test("today's library builds exactly as before, and v1 adds its export and its script beside the same files", async () => {
  const today = await list(SITE_DIR);
  expect(today.filter((f) => f.startsWith("data/") || f.startsWith("reading."))).toEqual([]);
  const v1 = await list(V1_DIR);
  const added = v1.filter((f) => !today.includes(f));
  expect(v1.filter((f) => !added.includes(f))).toEqual(today);
  expect(added.filter((f) => !/^reading\.([0-9a-f]{10}\.)?js$/.test(f))).toEqual([`${V1_DATA}/en.json`, `${V1_DATA}/library.json`]);
  const differ: string[] = [];
  for (const file of today) {
    const [a, b] = await Promise.all([Bun.file(join(SITE_DIR, file)).text(), Bun.file(join(V1_DIR, file)).text()]);
    if (a !== b) differ.push(file);
  }
  expect(differ).toEqual([]);
});

test("in dev the draft topic has its page in each explanation language it is written in, with its data and the script, and the review preview", async () => {
  const pages = (await list(DEV_DIR)).filter((f) => f.includes("/v1/") && f.endsWith("index.html"));
  expect(pages).toEqual(["en/english/v1/letters/index.html", "uk/english/v1/letters/index.html"]);
  const html = await Bun.file(join(DEV_DIR, "uk/english/v1/letters/index.html")).text();
  expect(html).toContain('<article class="rd-article lx" id="rd" lang="uk">');
  expect(html).toContain('<script type="application/json" id="rd-data">');
  expect(html).toMatch(/<script src="\/reading\.[0-9a-f]{10}\.js" defer><\/script>/);
  expect(html).toContain('<nav class="tp-outline"');
  // The page embeds the topic in its own language and the course's and names the other languages' layer files (7.4), and
  // holds the level popover with its entries: the topic, part 00 and each subtopic.
  const en = await Bun.file(join(DEV_DIR, "en/english/v1/letters/index.html")).text();
  expect(en).toContain(`"layers":{"uk":"/${V1_DATA}/en/letters.uk.json"}`);
  expect(html).toContain('"layers":{}');
  expect(html).toContain('id="lv-pop"');
  expect(html).toContain('<script type="application/json" id="lv-data">{"topic":{"t":');
  expect(html).toContain('"essence":{"t":');
  // The review preview is a v1 preview's alone: its queue and a draft per topic, with their script.
  const all = await list(DEV_DIR);
  expect(all.filter((f) => f.startsWith("review/") && f.endsWith(".html"))).toEqual(["review/en.letters/index.html", "review/index.html"]);
  expect(all.some((f) => /^review\.([0-9a-f]{10}\.)?js$/.test(f))).toBe(true);
  expect((await list(V1_DIR)).filter((f) => f.startsWith("review"))).toEqual([]);
});

test("the export holds the approved topics alone, and in dev every draft too (RV-03)", async () => {
  const library = await json<LibraryFile>(V1_DIR, "library.json");
  expect(library.courses.map((c) => c.code)).toEqual(["en"]);
  expect((await json<CourseFile>(V1_DIR, "en.json")).topics).toEqual([]);
  expect((await json<CourseFile>(DEV_DIR, "en.json")).topics.map((t) => t.slug)).toEqual([topic.slug]);
  // One layer file per topic and language beside the course file, for the drafts in dev and none for the approved set here.
  const layers = (dir: string): Promise<string[]> => list(dir).then((all) => all.filter((f) => f.startsWith(`${V1_DATA}/en/`)));
  expect(await layers(V1_DIR)).toEqual([]);
  expect(await layers(DEV_DIR)).toEqual([`${V1_DATA}/en/${topic.slug}.uk.json`]);
  const layer = await json<{ version: string; language: string; topic: string }>(DEV_DIR, `en/${topic.slug}.uk.json`);
  expect([layer.language, layer.topic]).toEqual(["uk", topic.slug]);
});

test("a command line names its library with --library, and today's without it", () => {
  expect(libraryArg(["--full"])).toBe("today");
  expect(libraryArg(["--library", "v1", "en.verbs.would"])).toBe("v1");
  expect(libraryArg(["--library", "today"])).toBe("today");
  expect(() => libraryArg(["--library", "v2"])).toThrow("--library takes today or v1, not v2");
  expect(() => libraryArg(["--library"])).toThrow("--library takes today or v1, not nothing");
});

test("a command line names the new library's root with --root, from core's root", () => {
  expect(rootArg(["--library", "v1"])).toBeUndefined();
  expect(rootArg(["--library", "v1", "--root", "library/samples"])).toBe(join(import.meta.dir, "../../library/samples"));
  expect(() => rootArg(["--root"])).toThrow("--root takes a folder");
  expect(() => rootArg(["--root", "--full"])).toThrow("--root takes a folder");
});
