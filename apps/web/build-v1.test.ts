// The build reads the library it is given: with "v1" it writes today's pages as they are and, beside them in data/v1/,
// the new library's export of the fixture library, its approved topics alone, and every draft too in dev (RV-03).
import { afterAll, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { CourseFile, LibraryFile } from "../../scripts/generated/export-v1.ts";
import { fixture, SOURCE, write } from "../../scripts/v1/fixture.ts";
import { build, libraryArg, V1_DATA } from "./build.ts";
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

test("today's library builds exactly as before, and v1 adds the new library's export beside the same files", async () => {
  const today = await list(SITE_DIR);
  expect(today.filter((f) => f.startsWith("data/"))).toEqual([]);
  const v1 = await list(V1_DIR);
  expect(v1.filter((f) => !f.startsWith(`${V1_DATA}/`))).toEqual(today);
  expect(v1.filter((f) => f.startsWith(`${V1_DATA}/`))).toEqual([`${V1_DATA}/en.json`, `${V1_DATA}/library.json`]);
  const differ: string[] = [];
  for (const file of today) {
    const [a, b] = await Promise.all([Bun.file(join(SITE_DIR, file)).text(), Bun.file(join(V1_DIR, file)).text()]);
    if (a !== b) differ.push(file);
  }
  expect(differ).toEqual([]);
});

test("the export holds the approved topics alone, and in dev every draft too (RV-03)", async () => {
  const library = await json<LibraryFile>(V1_DIR, "library.json");
  expect(library.courses.map((c) => c.code)).toEqual(["en"]);
  expect((await json<CourseFile>(V1_DIR, "en.json")).topics).toEqual([]);
  expect((await json<CourseFile>(DEV_DIR, "en.json")).topics.map((t) => t.slug)).toEqual([topic.slug]);
});

test("a command line names its library with --library, and today's without it", () => {
  expect(libraryArg(["--full"])).toBe("today");
  expect(libraryArg(["--library", "v1", "en.verbs.would"])).toBe("v1");
  expect(libraryArg(["--library", "today"])).toBe("today");
  expect(() => libraryArg(["--library", "v2"])).toThrow("--library takes today or v1, not v2");
  expect(() => libraryArg(["--library"])).toThrow("--library takes today or v1, not nothing");
});
