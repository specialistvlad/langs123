// The vocabulary check: a word's lemmas by its language's endings, the words of a text the lists lack with the marks'
// content left out, the lists to a level, and a topic's elements with unknown words at their level or the levels the
// file lacks.
import { expect, test } from "bun:test";
import { fixture } from "../v1/fixture.ts";
import { typedLibrary } from "../v1/library.ts";
import { parseMarks } from "../v1/marks.ts";
import { lemmas } from "./lemmas.ts";
import { knownTo, unknownIn, unknownWords } from "./vocabulary.ts";

test("a word's lemmas: the word, the part before an apostrophe, and each ending turned into its dictionary form", () => {
  expect(lemmas("letters", "en")).toEqual(["letters", "letter"]);
  expect(lemmas("studies", "en")).toContain("study");
  expect(lemmas("don't", "en")).toContain("do");
  expect(lemmas("it's", "en")).toContain("it");
  expect(lemmas("as", "en")).toEqual(["as"]);
  expect(lemmas("hablamos", "es")).toContain("hablar");
  expect(lemmas("casas", "es")).toContain("casa");
  expect(lemmas("parlons", "fr")).toContain("parler");
  expect(lemmas("parliamo", "it")).toContain("parlare");
  expect(lemmas("Häusern", "de")).toContain("Häuser");
  expect(lemmas("читаю", "uk")).toContain("читати");
  expect(lemmas("книги", "uk")).toContain("книга");
  expect(lemmas("word", "xx")).toEqual(["word"]);
});

test("the words a text holds outside its marks that the lists lack, lowercased, each once", () => {
  const { runs } = parseMarks("The {term A} letters' names don't change, as {l1 uk слово} shows; a-b and {ipa eɪ}.");
  const known = new Set(["the", "letter", "name", "do", "change", "as", "show", "a-b", "and"]);
  expect(unknownWords(runs, "en", known)).toEqual([]);
  expect(unknownWords(runs, "en", new Set(["the"]))).toEqual(["letters", "names", "don't", "change", "as", "shows", "a-b", "and"]);
  expect(knownTo({ source: "s", levels: { A0: ["Ab", "c"], A1: ["d"] } }, "A1")).toEqual(new Set(["ab", "c", "d"]));
  expect(knownTo({ source: "s", levels: { A0: ["a"] } }, "A1")).toBeUndefined();
});

test("a topic's elements with unknown words at their level, and the levels the file lacks", () => {
  const { library } = typedLibrary(fixture().files);
  const course = library.courses[0];
  const topic = course?.topics[0];
  if (course === undefined || topic === undefined) throw new Error("the fixture holds a topic");
  const a0 = [
    "the",
    "letter",
    "name",
    "a",
    "each",
    "has",
    "as",
    "its",
    "by",
    "is",
    "of",
    "differ",
    "variety",
    "let",
    "be",
    "say",
    "and",
    "with",
    "are",
  ];
  const a1 = ["verb", "add", "after", "person", "singular", "plural", "first", "keep", "one", "form", "read"];
  const found = unknownIn(course, topic, { source: "s", levels: { A0: a0, A1: a1 } });
  expect(found.opening).toEqual([]);
  expect(found.explanations).toEqual([
    { id: "names.why.1", level: "A0", words: ["said"] },
    { id: "err.a.uk", level: "A0", words: ["ukrainian", "reads"] },
    { id: "err.s.ja", level: "A1", words: ["japanese"] },
  ]);
  expect(found.missing).toEqual([]);
  const partial = unknownIn(course, topic, { source: "s", levels: { A0: a0.filter((w) => w !== "the") } });
  expect(partial.opening.map((u) => [u.id, u.words])).toEqual([
    ["title", ["the"]],
    ["def", ["the"]],
  ]);
  expect(partial.explanations.map((u) => u.id)).toEqual(["names.why.1", "err.a.rule", "err.a.uk"]);
  expect(partial.missing).toEqual(["A1"]);
});
