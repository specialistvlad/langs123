// Gate 4a check 5: a changed sentence re-flags only itself, in every language that translates it.
import { expect, test } from "bun:test";
import type { TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";
import { SOURCE, UK } from "./fixture.ts";
import { fingerprint, sourceFingerprints, staleIn, stamped, translatedIds, withFingerprints } from "./fingerprints.ts";

const JA: TopicLanguageFile = { language: "ja", nativeReview: false, text: { title: "文字", "names.title + names.fact.1": "名前。" } };

test("a fingerprint is the first 8 hex digits of the SHA-256 of the sentence in NFC", () => {
  expect(fingerprint("café")).toBe(fingerprint("café"));
  expect(fingerprint("The letters")).toMatch(/^[0-9a-f]{8}$/);
  expect(sourceFingerprints(SOURCE).get("title")).toBe(fingerprint("The letters"));
  expect(sourceFingerprints(SOURCE).has("ess.a")).toBe(false);
});

test("a changed sentence re-flags only itself, in each language that translates it (LA-08, LA-10)", () => {
  const ja = { ...JA, fingerprints: stamped(SOURCE, JA) };
  expect(staleIn(SOURCE, UK)).toEqual([]);
  expect(staleIn(SOURCE, ja)).toEqual([]);
  const changed: TopicSource = structuredClone(SOURCE);
  changed.title.text = "Letters and their names";
  const was = fingerprint("The letters");
  const now = fingerprint("Letters and their names");
  const message = `the source sentence changed since its translation (${was}, now ${now})`;
  expect(staleIn(changed, UK)).toEqual([{ id: "title", message }]);
  expect(staleIn(changed, ja)).toEqual([{ id: "title", message }]);
});

test("a translation without its fingerprint is named, and stamping records it", () => {
  expect(staleIn(SOURCE, JA).map((s) => s.id)).toEqual(["title", "names.title", "names.fact.1"]);
  expect(stamped(SOURCE, JA, ["title"])).toEqual({ title: fingerprint("The letters") });
  expect(Object.keys(stamped(SOURCE, { ...JA, text: { ...JA.text, gone: "x" } }))).toEqual(["names.fact.1", "names.title", "title"]);
  expect(translatedIds(JA)).toEqual(["title", "names.title", "names.fact.1"]);
});

test("withFingerprints puts the record at the file's end and keeps the rest as written", () => {
  const text = "# uk\nlanguage: uk\nfingerprints:\n  title: 00000000\n\n  def: 11111111\ntext:\n  title: Літери\n";
  expect(withFingerprints(text, { title: "1e100000", def: "abcdef12" })).toBe(
    '# uk\nlanguage: uk\ntext:\n  title: Літери\nfingerprints: { title: "1e100000", def: abcdef12 }\n',
  );
  expect(withFingerprints("language: uk\n", {})).toBe("language: uk\nfingerprints: {}\n");
});
