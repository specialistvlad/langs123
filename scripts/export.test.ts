// The exported library matches its schema, holds every written topic, and keeps each block's type.
import { expect, test } from "bun:test";
import Ajv from "ajv";
import { join } from "node:path";
import { exportLibrary, type LibraryItem } from "./export.ts";
import { topic } from "./export/blocks.ts";
import { inTrack } from "./export/text.ts";
import { CONTENT, EXPLAIN_CODES, type ListBlock, loadCurriculum, loadTopics, readYaml } from "./lib.ts";
import { SAMPLE as SAMPLE_TOPIC } from "./sample-topic.ts";

const library = await exportLibrary();

test("the export matches languages/schema/library.schema.json", async () => {
  const validate = new Ajv({ allErrors: true, strict: true }).compile(
    await readYaml<object>(join(CONTENT, "schema", "library.schema.json")),
  );
  const valid = validate(JSON.parse(JSON.stringify(library)));
  expect(validate.errors?.slice(0, 5) ?? []).toEqual([]);
  expect(valid).toBe(true);
});

test("the export holds every written topic, each with its own blocks' types", async () => {
  const written = (await loadTopics()).filter((r) => r.topic !== null);
  expect(Object.keys(library.topics).sort()).toEqual(written.map((r) => r.id).sort());
  const types = new Set(
    Object.values(library.topics).flatMap((t) => [...t.cheatsheet, ...t.sections.flatMap((s) => s.blocks)].map((b) => b.type)),
  );
  expect([...types].sort()).toEqual(["comparison", "errors", "inventory", "list", "paradigm", "prose", "usage"]);
});

test("a language with varieties keys the text that reads differently by variety", () => {
  const spanish = JSON.stringify(Object.values(library.topics).filter((t) => t.lang === "es"));
  expect(spanish).toContain('"es@es-419":');
  expect(spanish).toContain('"es@es-ES":');
});

test("a note about a variety names it before its text, or stands as the name alone", async () => {
  const english = (await loadCurriculum()).languages.find((l) => l.code === "en");
  if (english === undefined) throw new Error("curriculum.yaml has no English");
  const fixture = structuredClone(SAMPLE_TOPIC);
  const list = fixture.sections[0]?.content[1] as ListBlock;
  const text = Object.fromEntries(EXPLAIN_CODES.map((l) => [l, "Note."]));
  list.items.push({ type: "note", level: "A1", variety: "en-US", text }, { type: "note", level: "A1", variety: "en-US", ex: "Ex." });
  const out = inTrack(english, () => topic(fixture, "languages/en/sample/topic.yaml"));
  const items = (out.sections[0]?.blocks[1] as { items: LibraryItem[] }).items;
  const name = items[1]?.label?.["en"] ?? "";
  expect(name).not.toBe("");
  expect(items[1]?.text?.["en"]).toBe(`${name}: Note.`);
  expect(items[1]?.body?.["en"]).toBe("Note.");
  expect(items[2]?.text?.["en"]).toBe(`${name}:`);
});
