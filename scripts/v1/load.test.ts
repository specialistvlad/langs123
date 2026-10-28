// The loader reads a library root from disk as the checks read it in memory, and names what it can't read.
import { expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { ROOT } from "../lib.ts";
import { checkRoot } from "./check.ts";
import { files, named, write } from "./fixture.ts";
import { languageOfFile, readLibrary } from "./load.ts";

test("readLibrary reads every course, topic and file of a root, and checkRoot finds the fixture whole", async () => {
  const library = files();
  library.approvals = { file: "library/approvals.yaml", data: [{ what: "samples", by: "owner", date: "2026-10-28" }] };
  library.concepts = { file: "library/concepts.yaml", data: { alphabet: { description: "The letters of a script." } } };
  const topic = library.courses[0]?.topics[0];
  if (topic) {
    topic.review = {
      file: "library/en/letters/review.yaml",
      data: { writer: { session: "w", model: "m" }, statuses: [{ status: "draft", date: "2026-10-28", by: "w" }] },
    };
  }
  const root = await write(library);
  await mkdir(join(root, "schema"));
  await mkdir(join(root, "ja"));
  await writeFile(join(root, "ja", "report.md"), "notes");
  const read = await readLibrary(root);
  expect(read.courses.map((c) => [c.course, c.topics.map((t) => t.slug)])).toEqual([["en", ["letters"]]]);
  expect(read.courses[0]?.topics[0]?.languages.map((l) => l.file)).toEqual([named(root, "library/en/letters/uk.yaml")]);
  expect(read.courses[0]?.topics[0]?.review?.data).toEqual(topic?.review?.data);
  expect(read.approvals?.data).toEqual(library.approvals.data);
  expect(read.concepts?.data).toEqual(library.concepts.data);
  const { library: checked, problems } = await checkRoot(root);
  expect(problems).toEqual([]);
  expect(checked.courses[0]?.topics[0]?.review?.data.writer.session).toBe("w");
  expect(checked.approvals?.data).toHaveLength(1);
});

test("a file whose YAML doesn't parse, a file the topic's folder doesn't hold, and a folder without source.yaml are named", async () => {
  const root = await write(files());
  await writeFile(join(root, "en", "letters", "notes.yaml"), "a: 1");
  await writeFile(join(root, "en", "letters", "ja.yaml"), "language: [ja");
  await mkdir(join(root, "en", "empty"));
  await mkdir(join(root, "es", "words"), { recursive: true });
  await writeFile(join(root, "es", "words", "source.yaml"), "id: es.words");
  const { problems } = await checkRoot(root);
  const said = [...new Set(problems.map((p) => `${p.rule ?? "schema"} ${relative(root, join(ROOT, p.file))}`))].sort();
  expect(said).toEqual([
    "IX-01 es",
    "LA-01 en/empty",
    "RV-13 es/words/source.yaml",
    "SH-02 es/words/source.yaml",
    "SH-11 es/words/source.yaml",
    "SH-14 es/words/source.yaml",
    "SH-24 es/words/source.yaml",
    "schema en/letters/ja.yaml",
    "schema en/letters/notes.yaml",
  ]);
});

test("languageOfFile reads a language file's name", () => {
  expect(languageOfFile("library/en/letters/uk.yaml")).toBe("uk");
  expect(languageOfFile("source.yaml")).toBe("");
});
