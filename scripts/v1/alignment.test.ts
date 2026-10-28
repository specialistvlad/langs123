// Gate 4a check 4: alignment holds. A removed translation is named; recorded joins and splits pass; a join of
// sentences apart, an own block placed after no block, and an example translated in the course's own language fail.
import { expect, test } from "bun:test";
import type { TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";
import { alignmentProblems } from "./alignment.ts";
import { stamped } from "./fingerprints.ts";
import { SOURCE, UK } from "./fixture.ts";
import type { Topic } from "./library.ts";

const FILE = "library/en/letters/uk.yaml";
const topic = (change: (uk: TopicLanguageFile, source: TopicSource) => void = () => undefined, course = "en"): Topic => {
  const { source, uk } = structuredClone({ source: SOURCE, uk: UK });
  change(uk, source);
  uk.fingerprints = stamped(source, uk);
  return {
    course,
    slug: "letters",
    source: { file: "library/en/letters/source.yaml", data: source },
    languages: [{ file: FILE, data: uk }],
  };
};
const said = (t: Topic, source = "en"): string[] =>
  alignmentProblems(t, source).map((p) => `${p.rule ?? ""} ${p.id ?? p.file}: ${p.message}`);

test("the fixture's Ukrainian, with its split, aligns with its source", () => {
  expect(said(topic())).toEqual([]);
});

test("a removed translation is named, and a translation of no sentence too (LA-06)", () => {
  expect(said(topic((uk) => Reflect.deleteProperty(uk.text, "names.why.1")))).toEqual([
    "LA-06 names.why.1: the source sentence has no translation",
  ]);
  expect(said(topic((uk) => (uk.text["names.gone"] = "x")))).toEqual(["LA-06 names.gone: no sentence of the source has this id"]);
  expect(said(topic((uk) => (uk.text["title + def"] = "x")))).toEqual([
    "LA-06 title: the source sentence is translated twice",
    "LA-06 def: the source sentence is translated twice",
  ]);
});

test("a join of sentences that follow each other in one block passes; any other join is named (LA-07)", () => {
  const joined = topic((uk, source) => {
    (source.subtopics[0]?.blocks[0] as { text: { id: string; text: string }[] }).text.push({
      id: "names.fact.2",
      text: "Its name is said.",
    });
    Reflect.deleteProperty(uk.text, "names.fact.1");
    uk.text["names.fact.1 + names.fact.2"] = "Кожна літера має назву, і її вимовляють.";
  });
  expect(said(joined)).toEqual([]);
  const apart = topic((uk) => {
    Reflect.deleteProperty(uk.text, "title");
    Reflect.deleteProperty(uk.text, "names.title");
    uk.text["title + names.title"] = "x";
  });
  expect(said(apart)).toEqual(["LA-07 title + names.title: a join names sentences that follow each other in one block"]);
});

test("an own block, error and speakers' reason stand after the source's (LA-05)", () => {
  const placed = topic((uk) => {
    Object.assign(uk.blocks?.[0] ?? {}, { in: "nowhere" });
    Object.assign(uk.blocks?.[1] ?? {}, { after: "forms.table" });
    uk.errors = [
      {
        id: "uk.err.1",
        in: "elsewhere",
        after: "err.x",
        wrong: "w",
        right: "r",
        rule: { id: "uk.err.1.rule", text: "П." },
        speakers: { uk: { id: "uk.err.1.uk", text: "П." } },
      },
      {
        id: "uk.err.2",
        in: "names",
        after: "err.a",
        wrong: "w",
        right: "r",
        rule: { id: "uk.err.2.rule", text: "П." },
        speakers: { uk: { id: "uk.err.2.uk", text: "П." } },
      },
    ];
    uk.speakers = { "err.s": { id: "uk.err.s.uk", text: "П." }, "err.none": { id: "uk.err.none.uk", text: "П." } };
  });
  expect(said(placed)).toEqual([
    "LA-05 uk.names.fact: no subtopic of the source is nowhere",
    "LA-05 uk.names.example: forms.table is no block of the subtopic names",
    "LA-05 uk.err.1: no subtopic of the source is elsewhere",
    "LA-05 uk.err.1: err.x is no error of the source",
    "LA-05 err.none: no error of the source has this id",
  ]);
});

test("a file in the course's own language leaves the examples untranslated (FT-07)", () => {
  const own = topic(() => undefined, "uk");
  expect(said(own, "en")).toContain("FT-07 ex.apple: an example stands untranslated in the course's own language");
  expect(said(own, "en").every((s) => s.startsWith("FT-07"))).toBe(true);
});

test("a topic past its draft has a file for each explanation language but the source (LA-01)", () => {
  const review = topic((_, source) => (source.status = "in-review"));
  expect(said(review)).toContain("LA-01 library/en/letters/ja.yaml: the topic has no file for this explanation language");
  expect(said(review)).toHaveLength(10);
});

test("a translation whose source changed is stale (LA-10)", () => {
  const t = topic();
  t.source.data.definition.text = "The letters, and their names.";
  expect(said(t)).toEqual([expect.stringMatching(/^LA-10 def: the source sentence changed since its translation/) as unknown as string]);
});
