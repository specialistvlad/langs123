// The review's questions, targets and requests: every question rule of the catalog is asked by its request, of its
// part of the text, where its catalog lines say it holds, or stays pending until M6 brings its input.
import { expect, test } from "bun:test";
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { files } from "../v1/fixture.ts";
import { typedLibrary } from "../v1/library.ts";
import { ASKS, questionsOf } from "./questions.ts";
import { languageRequest, sourceRequest } from "./request.ts";
import { targetIds } from "./targets.ts";

const catalog = await readRules(RULES_FILE);
const { library } = typedLibrary(files());
const [course] = library.courses;
const [topic] = course?.topics ?? [];
if (course === undefined || topic === undefined) throw new Error("the fixture holds a course and a topic");
const uk: TopicLanguageFile = topic.languages[0]?.data ?? { language: "uk", nativeReview: false, text: {} };

test("every question rule of the catalog but the catalog's own is asked by a request, and nothing else is", () => {
  const questions = catalog.rules.filter((r) => r.fields.check === "question").map((r) => r.id);
  expect(questions.filter((id) => ASKS[id] === undefined)).toEqual(["CA-02"]);
  expect(Object.keys(ASKS).filter((id) => !questions.includes(id))).toEqual([]);
  const pending = ["source", "language", "index"].flatMap((k) =>
    questionsOf(catalog, k as "source")
      .filter((q) => q.pending !== undefined)
      .map((q) => q.rule),
  );
  expect([...new Set(pending)].sort()).toEqual(["FT-08", "IX-11", "IX-14", "NO-04", "NO-07", "SH-09", "VO-03"]);
  expect(questionsOf(catalog, "language").find((q) => q.rule === "RV-11")).toMatchObject({ subject: "sentence", target: "translations" });
});

test("each target names its elements in the source, and in a language file beside it", () => {
  expect(targetIds(topic, "definition")).toEqual(["def"]);
  expect(targetIds(topic, "opening")).toEqual(["title", "def", "ess.a", "ess.z", "ess.do"]);
  expect(targetIds(topic, "whys")).toEqual(["names.why"]);
  expect(targetIds(topic, "lists")).toEqual(["names.list"]);
  expect(targetIds(topic, "facts")).toEqual(["names.fact", "forms.fact"]);
  expect(targetIds(topic, "errors")).toEqual(["err.a", "err.s"]);
  expect(targetIds(topic, "reasons")).toEqual(["err.a.uk", "err.s.ja"]);
  expect(targetIds(topic, "essence")).toEqual(["essence"]);
  expect(targetIds(topic, "examples")).toContain("ex.apple");
  expect(targetIds(topic, "course text")).toContain("names.a");
  expect(targetIds(topic, "sentences")).toContain("names.fact.1");
  expect(targetIds(topic, "explanations")).not.toContain("ex.apple");
  expect(targetIds(topic, "blocks")).toHaveLength(6);
  expect(targetIds(topic, "untagged blocks")).toHaveLength(6);
  expect(targetIds(topic, "translations")).toEqual([]);
  expect(targetIds(topic, "translations", uk)).toContain("names.fact.1");
  expect(targetIds(topic, "example translations", uk)).toContain("ex.apple");
  expect(targetIds(topic, "explanations", uk)).toContain("uk.names.fact.1");
  expect(targetIds(topic, "sentences", uk)).toContain("uk.names.box");
  expect(targetIds(topic, "facts", uk)).toEqual(["names.fact", "forms.fact", "uk.names.fact"]);
  expect(targetIds(topic, "whys", uk)).toEqual(["names.why"]);
  expect(targetIds(topic, "own blocks", uk)).toEqual(["uk.names.fact", "uk.names.example"]);
  expect(targetIds(topic, "reasons", { ...uk, speakers: { "err.s": { id: "uk.err.s.uk", text: "П." } } })).toEqual([
    "err.a.uk",
    "err.s.ja",
    "uk.err.s.uk",
  ]);
  expect(targetIds(topic, "errors", uk)).toEqual([]);
  const ownError = {
    id: "uk.err.1",
    in: "names",
    wrong: "w",
    right: "r",
    rule: { id: "uk.err.1.rule", text: "П." },
    speakers: { uk: { id: "uk.err.1.uk", text: "П." } },
  };
  expect(targetIds(topic, "errors", { ...uk, errors: [ownError] })).toEqual(["uk.err.1"]);
  expect(targetIds(topic, "reasons", { ...uk, errors: [ownError] })).toEqual(["err.a.uk", "err.s.ja", "uk.err.1.uk"]);
  expect(targetIds(topic, "opening", uk)).toEqual(["title", "def"]);
  for (const t of [
    "lists",
    "blocks",
    "untagged blocks",
    "course text",
    "entries",
    "practical entries",
    "new entries",
    "essence",
    "examples",
  ] as const) {
    expect(targetIds(topic, t, uk)).toEqual([]);
  }
  for (const t of ["entries", "practical entries", "new entries"] as const) expect(targetIds(topic, t)).toEqual([]);
});

test("a source request asks its questions where they hold, counts them, and lists the pending ones", () => {
  const r = sourceRequest(topic, course, catalog);
  expect(r).toMatchObject({ kind: "source", topic: "en.letters" });
  expect(r.asked).toMatchObject({ "SH-04": 1, "SH-21": 2, "NO-50": 6 });
  expect(r.prompt).toContain("A finding is a yes answer, where the block carries no variety.");
  expect(r.asked).not.toHaveProperty("NO-13");
  expect(r.pending).toEqual(["SH-09", "VO-03", "IX-14"]);
  expect(r.inputs).toEqual({
    "SH-09": "the vocabulary of each level",
    "VO-03": "the vocabulary of each level",
    "IX-14": "the reference list",
  });
  expect(r.asked["FT-08"]).toBeGreaterThan(0);
  expect(r.prompt).toContain(
    "- FT-08, the steps before this topic ({list}), each with its subject and what it covers: none, this is the first",
  );
  expect(r.prompt).toContain("- SH-04 [sentence], asked of def: Yes or no:");
  expect(r.prompt).toContain("asked of every sentence of explanation (");
  expect(r.prompt).toContain("Neighbour topics ({titles}): none.");
  expect(r.prompt).toContain("```yaml\nid: en.letters");
});

test("a language request reads the file beside its source, without its fingerprints", () => {
  const r = languageRequest(topic, course, uk, catalog);
  expect(r).toMatchObject({ kind: "language", language: "uk" });
  expect(r.asked).toMatchObject({ "RV-11": Object.keys(uk.text).length, "ER-08": 2 });
  expect(r.prompt).toContain("## The uk file");
  expect(r.prompt).not.toContain("fingerprints:");
  const ja = languageRequest(topic, { ...course, index: undefined } as never, { ...uk, language: "ja" }, catalog);
  expect(ja.asked).toHaveProperty("NO-21");
  expect(ja.prompt).toContain("its varieties: none");
});
