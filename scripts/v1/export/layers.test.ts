// The layer files (7.4): one per topic and language of the export, each holding that language's text, spans, example
// translations, own blocks and minutes alone, valid against its schema; a topic cut to some languages keeps theirs alone.
import { expect, test } from "bun:test";
import Ajv from "ajv";
import { layerPath, topicIn, VERSION } from "../../../api.ts";
import type { TopicLanguageFile } from "../../generated/library-v1.ts";
import { fixture } from "../fixture.ts";
import { typedLibrary } from "../library.ts";
import { layersOf } from "./layers.ts";
import { exportCourses } from "./library.ts";

const SCHEMA = (await Bun.file(`${import.meta.dir}/../../../library/schema/export.schema.json`).json()) as object;
const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, discriminator: true });
ajv.addVocabulary(["x-component"]);
ajv.addSchema(SCHEMA);

const f = fixture();
const uk = f.topic.languages[0]?.data as TopicLanguageFile | undefined;
if (uk === undefined) throw new Error("the fixture holds a Ukrainian file");
// The Ukrainian file joins two sentences of the names fact, so one layer carries a span.
uk.text["names.fact.1 + names.z"] = "Кожна літера має назву, а назва Z залежить від варіанта.";
Reflect.deleteProperty(uk.text, "names.fact.1");
Reflect.deleteProperty(uk.text, "names.z");
const v1 = exportCourses(typedLibrary(f.files).library, { drafts: true });
// The element of the id given, at any depth.
const nodeOf = (node: unknown, id: string): Record<string, unknown> | undefined => {
  if (Array.isArray(node)) return node.map((n) => nodeOf(n, id)).find((n) => n !== undefined);
  if (typeof node !== "object" || node === null) return undefined;
  const n = node as Record<string, unknown>;
  return n["id"] === id
    ? n
    : Object.values(n)
        .map((v) => nodeOf(v, id))
        .find((x) => x !== undefined);
};
const topic = v1.courses[0]?.topics[0];
if (topic === undefined) throw new Error("the fixture's export holds a topic");

test("one layer per topic and language, at <course>/<slug>.<language>.json, each valid against its schema", () => {
  expect(v1.layers.map((l) => l.path)).toEqual(["en/letters.en.json", "en/letters.uk.json"]);
  expect(layersOf(v1.courses)).toEqual(v1.layers);
  for (const l of v1.layers) expect([l.path, ajv.validate("export.schema.json#/definitions/layerFile", l.data)]).toEqual([l.path, true]);
  const [en, layer] = v1.layers.map((l) => l.data);
  expect(layer).toMatchObject({ version: VERSION, course: "en", topic: "letters", language: "uk", minutes: topic.minutes["uk"] });
  expect(layer?.text["title"]).toBe("Літери");
  expect(layer?.text["names.fact.1"]).toBe("Кожна літера має назву, а назва Z залежить від варіанта.");
  expect(layer?.span).toEqual({ "names.fact.1": 2 });
  expect(layer?.text["names.z"]).toBeUndefined();
  expect(layer?.text["forms.fact.1"]).toBe("Після {term he} дієслово додає {term -s}.");
  expect(layer?.tr["ex.apple"]).toBe("яблуко");
  expect(layer?.own.blocks.map((b) => b.id)).toEqual(["uk.names.fact", "uk.names.example"]);
  expect(en?.text["title"]).toBe(topic.title.text["en"]);
  expect(en?.span).toBeUndefined();
  expect(en?.tr).toEqual({});
  expect(en?.own).toEqual({ blocks: [], errors: [], speakers: {} });
  expect(layerPath("es", "subject-pronouns", "ja")).toBe("es/subject-pronouns.ja.json");
});

test("a topic cut to some languages keeps their text, spans, translations and own blocks alone; its minutes stay whole", () => {
  const cut = topicIn(topic, ["uk"]);
  expect(Object.keys(cut.title.text)).toEqual(["uk"]);
  expect(cut.minutes).toEqual(topic.minutes);
  expect(Object.keys(cut.own)).toEqual(["uk"]);
  const fact = cut.subtopics.flatMap((s) => s.blocks).find((b) => b.id === "names.fact");
  expect(fact?.type === "fact" ? fact.text[0] : undefined).toEqual({
    id: "names.fact.1",
    text: { uk: "Кожна літера має назву, а назва Z залежить від варіанта." },
    span: { uk: 2 },
  });
  expect(nodeOf(cut, "ex.apple")?.["tr"]).toEqual({ uk: "яблуко" });
  expect(nodeOf(cut, "ex.apple")?.["text"]).toBe(nodeOf(topic, "ex.apple")?.["text"]);
  expect(topicIn(topic, ["en", "uk"])).toEqual(topic);
  expect(Object.keys(topicIn(topic, ["ja"]).title.text)).toEqual([]);
  expect(topicIn(topic, ["ja"]).own).toEqual({});
});
