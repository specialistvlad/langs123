// The schema of the new library: the fixture passes, and each schema rule's written case fails with that rule's id.
import { describe, expect, test } from "bun:test";
import type { CourseIndex, TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";
import { LEVELS } from "../lib.ts";
import { INDEX, SOURCE, UK } from "./fixture.ts";
import { formatProblem, type Problem, SCHEMA_FILE, schemaProblems } from "./schema.ts";

const source = (change: (s: TopicSource) => void): Problem[] => {
  const copy = structuredClone(SOURCE);
  change(copy);
  return schemaProblems("source", copy, "source.yaml");
};
const index = (change: (s: CourseIndex) => void): Problem[] => {
  const copy = structuredClone(INDEX);
  change(copy);
  return schemaProblems("index", copy, "index.yaml");
};
const rules = (problems: Problem[]): (string | undefined)[] => [...new Set(problems.map((p) => p.rule))];

test("the fixture's files pass their schema", () => {
  expect(schemaProblems("source", SOURCE, "source.yaml")).toEqual([]);
  expect(schemaProblems("language", UK, "uk.yaml")).toEqual([]);
  expect(schemaProblems("index", INDEX, "index.yaml")).toEqual([]);
  expect(
    schemaProblems(
      "review",
      { writer: { session: "writer-en", model: "claude-opus-5-5" }, statuses: [{ status: "draft", date: "2026-10-28", by: "writer-en" }] },
      "review.yaml",
    ),
  ).toEqual([]);
  expect(schemaProblems("approvals", [{ what: "index:en", by: "owner", date: "2026-10-28" }], "approvals.yaml")).toEqual([]);
  expect(schemaProblems("concepts", { alphabet: { description: "The letters of a script." } }, "concepts.yaml")).toEqual([]);
});

test("the schema's levels are levels.yaml's", async () => {
  const schema = (await Bun.file(SCHEMA_FILE).json()) as { definitions: { level: { enum: string[] } } };
  expect(schema.definitions.level.enum).toEqual([...LEVELS]);
});

describe("each schema rule's written case fails with its id", () => {
  test("the topic's shape", () => {
    expect(rules(source((s) => Reflect.deleteProperty(s, "title")))).toEqual(["SH-02"]);
    expect(rules(source((s) => (s.essence = [])))).toEqual(["SH-11"]);
    expect(rules(source((s) => (s.subtopics = [])))).toEqual(["SH-14"]);
    expect(rules(source((s) => Reflect.deleteProperty(s, "errors")))).toEqual(["SH-24"]);
    expect(rules(source((s) => Reflect.deleteProperty(s, "nativeReview")))).toEqual(["RV-13"]);
    expect(rules(source((s) => (s.status = "done" as TopicSource["status"])))).toEqual(["RV-01"]);
  });
  test("subtopics, blocks and items", () => {
    expect(rules(source((s) => Reflect.deleteProperty(s.subtopics[0] ?? {}, "level")))).toEqual(["ST-11"]);
    expect(rules(source((s) => Object.assign(s.subtopics[0] ?? {}, { level: "A3" })))).toEqual(["IX-17"]);
    expect(rules(source((s) => Object.assign(s.subtopics[0] ?? {}, { role: "form" })))).toEqual(["ST-09"]);
    expect(rules(source((s) => s.subtopics[0]?.blocks.push({ id: "p", type: "paradigm" } as never)))).toEqual(["ST-01"]);
    expect(rules(source((s) => Object.assign(s.subtopics[0] ?? {}, { id: "Names" })))).toEqual(["IX-23"]);
    expect(rules(source((s) => (s.essence[0] = { id: "ess.a", form: "A" } as never)))).toEqual(["SH-12"]);
    expect(
      rules(
        source((s) =>
          s.subtopics[0]?.blocks.splice(1, 1, { id: "l", type: "list", items: [{ id: "i", to: "names", form: "A" }] } as never),
        ),
      ),
    ).toEqual(["ST-02"]);
    expect(rules(source((s) => s.subtopics[1]?.blocks.splice(1, 1, { id: "t", type: "table", columns: [], rows: [] } as never)))).toEqual([
      "ST-03",
    ]);
    expect(rules(source((s) => Object.assign(s.essence[0] ?? {}, { variety: "British" })))).toEqual(["NO-28"]);
  });
  test("errors", () => {
    expect(rules(source((s) => Reflect.deleteProperty(s.errors[0] ?? {}, "right")))).toEqual(["ER-06"]);
    expect(rules(source((s) => Reflect.deleteProperty(s.errors[0] ?? {}, "in")))).toEqual(["ST-13"]);
    expect(rules(source((s) => Object.assign(s.errors[0] ?? {}, { speakers: {} })))).toEqual(["ER-02"]);
  });
  test("a language file's join or split", () => {
    const uk: TopicLanguageFile = { ...UK, text: { "title, def": "x" } };
    expect(rules(schemaProblems("language", uk, "uk.yaml"))).toEqual(["LA-07"]);
  });
  test("the index", () => {
    expect(rules(index((i) => (i.sections = [])))).toEqual(["IX-02"]);
    expect(rules(index((i) => Reflect.deleteProperty(i.sections[0]?.topics[0] ?? {}, "subject")))).toEqual(["IX-08"]);
    expect(rules(index((i) => Object.assign(i.sections[0]?.topics[0] ?? {}, { path: {} })))).toEqual(["IX-06"]);
    expect(rules(index((i) => Reflect.deleteProperty(i.sections[0]?.topics[0] ?? {}, "status")))).toEqual(["IX-21"]);
    expect(rules(index((i) => Object.assign(i.sections[0]?.topics[0] ?? {}, { practical: "verbs" })))).toEqual(["IX-12"]);
    expect(rules(index((i) => Reflect.deleteProperty(i.sources[0] ?? {}, "licence")))).toEqual(["IX-09"]);
    expect(rules(index((i) => Reflect.deleteProperty(i, "source")))).toEqual(["LA-09"]);
    expect(rules(index((i) => (i.varieties = ["en-GB"])))).toEqual(["NO-27"]);
    expect(rules(index((i) => Reflect.deleteProperty(i, "sections")))).toEqual(["IX-02"]);
  });
  test("the review record and the approvals", () => {
    expect(rules(schemaProblems("review", { statuses: [] }, "review.yaml"))).toEqual(["RV-04"]);
    expect(rules(schemaProblems("approvals", [{ what: "wave:A9", by: "owner", date: "2026-10-28" }], "approvals.yaml"))).toEqual(["RV-08"]);
  });
});

test("a problem reads with its rule, file, id and the failing path", () => {
  const said = index((i) => Object.assign(i.sections[0]?.topics[0] ?? {}, { practical: "verbs" })).map(formatProblem);
  expect(said[0]).toStartWith(
    "IX-12 index.yaml: /sections/0/topics/0/practical must be equal to one of the allowed values: question-words",
  );
  expect(formatProblem({ file: "a.yaml", id: "x", message: "m" })).toBe("schema a.yaml x: m");
  expect(source((s) => Object.assign(s, { extra: 1 }))[0]?.message).toBe("/ must NOT have additional properties: extra");
});
