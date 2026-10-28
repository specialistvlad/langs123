// Gate 4a check 7: the export carries every field the M3 screens read, and its version. The fixture's export holds
// its schema; each component of the presentation map finds its fields; drafts stay out unless asked for.
import { afterAll, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import Ajv from "ajv";
import { exportLibrary, VERSION } from "../../../api.ts";
import type { CourseFile, LibraryFile, Topic } from "../../generated/export-v1.ts";
import { fixture, write } from "../fixture.ts";
import { typedLibrary } from "../library.ts";
import { EXPORT_VERSION, exportCourses } from "./library.ts";

const SCHEMA = (await Bun.file(`${import.meta.dir}/../../../library/schema/export.schema.json`).json()) as {
  definitions: { libraryFile: { properties: { version: { const: string } } } };
};
const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, discriminator: true });
ajv.addVocabulary(["x-component"]);
ajv.addSchema(SCHEMA);

const drafted = (
  change: (f: ReturnType<typeof fixture>) => void = () => undefined,
): { library: LibraryFile; course: CourseFile; topic: Topic } => {
  const f = fixture();
  change(f);
  const out = exportCourses(typedLibrary(f.files).library, { drafts: true });
  const [course = { version: EXPORT_VERSION, course: "", topics: [] }] = out.courses;
  const [topic] = course.topics;
  if (topic === undefined) throw new Error("the fixture's export holds no topic");
  return { library: out.library, course, topic };
};
const { library, course, topic } = drafted();

test("the export holds its schema, and its version is the schema's and api.ts's", () => {
  expect(ajv.validate("export.schema.json#/definitions/libraryFile", library)).toBe(true);
  expect(ajv.validate("export.schema.json#/definitions/courseFile", course)).toBe(true);
  expect(library.version).toBe(EXPORT_VERSION);
  expect(SCHEMA.definitions.libraryFile.properties.version.const).toBe(EXPORT_VERSION);
  expect(VERSION).toBe(EXPORT_VERSION);
});

test("drafts stay out of the export unless asked for (RV-03)", () => {
  const out = exportCourses(typedLibrary(fixture().files).library);
  expect(out.courses[0]?.topics).toEqual([]);
  expect(out.library.courses[0]?.sections[0]?.topics).toEqual([]);
  expect(out.library.courses[0]?.path).toEqual([]);
});

test("I1 and R1 on the index screens: each course's name, levels, sections, topic rows and study path", () => {
  const [entry] = library.courses;
  expect(entry?.name["uk"]).toBe("English");
  expect(entry?.levels).toEqual(["A0", "A1"]);
  expect(entry?.varieties.map((v) => [v.code, v.name["en"]])).toEqual([
    ["en-GB", "UK"],
    ["en-US", "US"],
  ]);
  expect(entry?.sections[0]?.topics[0]).toEqual({
    id: "letters",
    title: topic.title.text,
    definition: topic.definition.text,
    levels: ["A0", "A1"],
    minutes: topic.minutes,
  });
  expect(entry?.path).toEqual([
    { level: "A0", topics: ["letters"] },
    { level: "A1", topics: ["letters"] },
  ]);
  expect(library.levels[0]).toMatchObject({ code: "A0", colors: { light: { ink: expect.any(String) as string } } });
  expect(Object.keys(topic.minutes)).toEqual(["en", "uk"]);
});

test("R1 and R2 in the reading: the head, numbered subtopics with their levels, facts and whys, a split translation", () => {
  expect(topic.title.text).toEqual({ en: "The letters", uk: "Літери" });
  expect(topic.subtopics.map((s) => [s.number, s.id, s.level, s.title.text["uk"]])).toEqual([
    [1, "names", "A0", "Назви"],
    [2, "forms", "A1", "Форми"],
  ]);
  expect(topic.subtopics[0]?.blocks[0]).toEqual({
    id: "names.fact",
    type: "fact",
    text: [
      {
        id: "names.fact.1",
        text: { en: "Each letter has a name, as {term A} has {ipa eɪ}.", uk: ["Кожна літера має назву.", "{term A} має назву {ipa eɪ}."] },
      },
    ],
  });
  expect(topic.subtopics[0]?.blocks[2]?.type).toBe("why");
});

test("R3 and R4: examples with their translations, list items and essence lines with their subtopic's level", () => {
  expect(topic.essence[0]).toEqual({ id: "ess.a", form: ["A", "a"], ipa: "eɪ", to: "names", level: "A0" });
  expect(topic.essence[2]).toMatchObject({
    to: "forms",
    level: "A1",
    ex: { id: "ess.do.ex", text: "I {target work}.", tr: { uk: "Я працюю." } },
  });
  expect(topic.subtopics[0]?.blocks[1]).toMatchObject({
    type: "list",
    items: [{ form: "A", ipa: "eɪ", ex: { tr: { uk: "яблуко" } } }, { text: { uk: "Її назва залежить від варіанта." } }],
  });
  expect(topic.subtopics[1]?.blocks[2]).toMatchObject({
    type: "example",
    items: [{ id: "forms.office" }, { id: "forms.us", variety: "en-GB" }],
  });
});

test("R5: a table's axes, its columns' text, its rows' features and cells", () => {
  expect(topic.subtopics[1]?.blocks[1]).toMatchObject({
    type: "table",
    axes: { rows: "person", columns: "number" },
    columns: [{ key: "person", text: { uk: "Особа" } }, { key: "sg" }, { key: "pl" }],
    rows: [
      { features: { person: 1 }, cells: { person: { id: "forms.first.name", text: { uk: "перша особа" } }, sg: ["I {target work}."] } },
      { cells: { sg: [{ form: "He {target works}.", variety: "en-GB" }] } },
    ],
  });
});

test("R6 and R7: each error with its subtopic's level, its correction, rule and speakers; the picture", () => {
  expect(topic.errors.map((e) => [e.id, e.in, e.level, Object.keys(e.speakers)])).toEqual([
    ["err.a", "names", "A0", ["uk"]],
    ["err.s", "forms", "A1", ["ja"]],
  ]);
  expect(topic.errors[1]?.right).toEqual({ id: "err.s.right", text: "She {target works}.", tr: { uk: "Вона працює." } });
  expect(topic.picture).toMatchObject({ kind: "scene-grid", cells: [{ line: "ess.a", place: "contained" }, { line: "ess.z" }] });
});

test("R8 and R9: text keeps its marks; a language's own text, a join's span, and an example left alone in the course's own language", () => {
  expect(topic.essence[1]?.ipa).toBe("{variant en-GB zed} {variant en-US ziː}");
  expect(topic.own["uk"]?.blocks.map((b) => [b.id, b.after])).toEqual([
    ["uk.names.fact", "names.list"],
    ["uk.names.example", "names.list"],
  ]);
  const joined = drafted((f) => {
    const uk = f.topic.languages[0]?.data as { text: Record<string, unknown> };
    Reflect.deleteProperty(uk.text, "title");
    Reflect.deleteProperty(uk.text, "def");
    uk.text["title + def"] = "Літери — це A і Z.";
  }).topic;
  expect(joined.title).toEqual({ id: "title", text: { en: "The letters", uk: "Літери — це A і Z." }, span: { uk: 2 } });
  expect(joined.definition.text["uk"]).toBeUndefined();
  const own = drafted((f) => {
    f.course.course = "uk";
    Object.assign(f.course.index?.data as object, { course: "uk", source: "en" });
    Object.assign(f.topic.languages[0]?.data as object, {
      errors: [
        {
          id: "uk.err.1",
          in: "forms",
          after: "err.s",
          wrong: "w",
          right: "r",
          rule: { id: "uk.err.1.rule", text: "П." },
          speakers: { uk: { id: "uk.err.1.uk", text: "П." } },
        },
      ],
    });
  }).topic;
  expect(own.essence[2]?.ex?.tr).toEqual({});
  expect(own.own["uk"]?.errors[0]?.level).toBe("A1");
});

const roots: string[] = [];
afterAll(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true })));
});

test("exportLibrary({ library: 'v1' }) reads a root of the library", async () => {
  const f = fixture();
  Object.assign(f.files.courses[0]?.topics[0]?.source?.data as object, { status: "approved" });
  const root = await write(f.files);
  roots.push(root);
  const out = await exportLibrary({ library: "v1", root });
  expect(out.courses[0]?.topics.map((t) => t.id)).toEqual(["en.letters"]);
  expect((await exportLibrary({ library: "v1", root, drafts: true })).library.courses[0]?.code).toBe("en");
});
