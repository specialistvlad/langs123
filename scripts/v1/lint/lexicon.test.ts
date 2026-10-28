// The linter's lists read from a library's folder: each language's words, the search needs and the kanji, each
// checked against its schema; and today's topic ids, read from today's curriculum.
import { afterAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLexicon, todayIds } from "./lexicon.ts";

const root = await mkdtemp(join(tmpdir(), "lexicon-"));
afterAll(async () => {
  await rm(root, { recursive: true });
});

test("readLexicon reads the words, the needs and the kanji, and names a file its schema refuses", async () => {
  for (const dir of ["words", "needs", "ja"]) await mkdir(join(root, dir));
  await Bun.write(join(root, "words", "uk.yaml"), "language: uk\naddress: [ти]\n");
  await Bun.write(join(root, "words", "xx.yaml"), "language: xx\n");
  await Bun.write(
    join(root, "needs", "uk.yaml"),
    "- { id: alphabet, queries: [англійський алфавіт], from: search-console, topic: en.alphabet }\n",
  );
  await Bun.write(
    join(root, "ja", "kanji.yaml"),
    "source: { name: A list, licence: CC BY 4.0, url: https://example.org }\nA1: [{ word: 日本, reading: にほん }]\n",
  );
  const { lexicon, needs, problems } = await readLexicon(root);
  expect(lexicon.words.get("uk")?.address).toEqual(["ти"]);
  expect(needs.map((n) => [n.language, n.data[0]?.topic])).toEqual([["uk", "en.alphabet"]]);
  expect(lexicon.kanji?.A1?.[0]?.word).toBe("日本");
  expect(problems.map((p) => p.message)).toEqual([
    "/language must be equal to one of the allowed values: en, uk, es, pt, fr, de, it, pl, tr, id, vi, ja",
  ]);
  expect((await readLexicon(join(root, "none"))).lexicon.words.size).toBe(0);
});

test("todayIds holds today's library's topic ids", async () => {
  expect((await todayIds()).has("en.foundations.alphabet-spelling")).toBe(true);
});
