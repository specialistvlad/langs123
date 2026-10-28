// Gate 4a check 6: adding a course or an explanation language is data and text alone (LA-02), and the checks name
// every gap with its path (LA-03). A course and a language join a copy of the fixture library, and the checks and
// the export take them with no change of code; no module of the new library writes a list of languages of its own.
import { expect, test } from "bun:test";
import type { CourseIndex, TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";
import { catalog, checkFiles } from "./check.ts";
import { exportCourses } from "./export/library.ts";
import { stamped } from "./fingerprints.ts";
import { fixture } from "./fixture.ts";
import { formatProblem } from "./schema.ts";

const rules = await catalog();

test("LA-02: a new course joins the library as its index and its topics, and the checks and the export take it", () => {
  const { files, course } = fixture();
  const de = structuredClone(course);
  de.course = "de";
  de.dir = "library/de";
  const index = de.index?.data as CourseIndex;
  Object.assign(index, { course: "de", source: "de" });
  Reflect.deleteProperty(index, "varieties");
  const topic = de.topics[0];
  const source = topic?.source?.data as TopicSource;
  source.id = "de.letters";
  // German has no varieties: its forms stand plain.
  const text = JSON.stringify(source)
    .replace(/\{variant en-GB zed\} \{variant en-US ziː\}/g, "zed")
    .replace('{"form":"He {target works}.","variety":"en-GB"}', '"He {target works}."')
    .replace(/,"variety":"en-GB"/g, "");
  Object.assign(source, JSON.parse(text) as TopicSource);
  for (const l of topic?.languages ?? []) {
    l.file = l.file.replace("library/en", "library/de");
    (l.data as TopicLanguageFile).fingerprints = stamped(source, l.data as TopicLanguageFile);
  }
  if (topic?.source) topic.source.file = "library/de/letters/source.yaml";
  if (de.index) de.index.file = "library/de/index.yaml";
  files.courses.push(de);
  (files.approvals?.data as { what: string; by: string; date: string }[]).push({ what: "index:de", by: "owner", date: "2026-10-28" });
  const { library, problems } = checkFiles(files, rules);
  expect(problems.map(formatProblem)).toEqual([]);
  const out = exportCourses(library, { drafts: true });
  expect(out.library.courses.map((c) => c.code)).toEqual(["en", "de"]);
  expect(out.courses[1]?.topics[0]?.title.text).toEqual({ de: "The letters", uk: "Літери" });
});

test("LA-02: a new explanation language joins a topic as its file, and the checks and the export take it", () => {
  const { files, topic } = fixture();
  const uk = topic.languages[0]?.data as TopicLanguageFile;
  const source = topic.source?.data as TopicSource;
  const pt: TopicLanguageFile = { ...structuredClone(uk), language: "pt", blocks: [] };
  pt.fingerprints = stamped(source, pt);
  topic.languages.push({ file: "library/en/letters/pt.yaml", data: pt });
  const { library, problems } = checkFiles(files, rules);
  expect(problems.map(formatProblem)).toEqual([]);
  const exported = exportCourses(library, { drafts: true }).courses[0]?.topics[0];
  expect(Object.keys(exported?.minutes ?? {})).toEqual(["en", "uk", "pt"]);
  expect(Object.keys(exported?.own ?? {})).toEqual(["uk", "pt"]);
});

test("LA-02: no module of the new library writes a list of explanation languages of its own", async () => {
  const lists: string[] = [];
  for await (const path of new Bun.Glob("**/*.ts").scan({ cwd: import.meta.dir })) {
    if (path.endsWith(".test.ts") || path.includes("fixture")) continue;
    const text = await Bun.file(`${import.meta.dir}/${path}`).text();
    for (const m of text.matchAll(/\[\s*"[a-z]{2}"\s*(?:,\s*"[a-z]{2}"\s*){2,}\]/g)) lists.push(`${path}: ${m[0]}`);
  }
  expect(lists).toEqual([]);
});

test("LA-03: a missing file, translation, name and string are each named with their path", () => {
  const { files, topic, course } = fixture();
  (topic.source?.data as TopicSource).status = "in-review";
  Reflect.deleteProperty((topic.languages[0]?.data as TopicLanguageFile).text, "names.why.1");
  Reflect.deleteProperty((course.index?.data as CourseIndex).sections[0]?.name ?? {}, "ja");
  (topic.source?.data as TopicSource).definition.text = "";
  const said = checkFiles(files, rules).problems.map(formatProblem);
  expect(said).toContain("schema library/en/index.yaml: /sections/0/name must have required property 'ja'");
  expect(said).toContain("schema library/en/letters/source.yaml: /definition/text must NOT have fewer than 1 characters");
  const { files: again, topic: same } = fixture();
  (same.source?.data as TopicSource).status = "in-review";
  Reflect.deleteProperty((same.languages[0]?.data as TopicLanguageFile).text, "names.why.1");
  const gaps = checkFiles(again, rules).problems.map(formatProblem);
  expect(gaps).toContain("LA-01 library/en/letters/ja.yaml: the topic has no file for this explanation language");
  expect(gaps).toContain("LA-06 library/en/letters/uk.yaml names.why.1: the source sentence has no translation");
});
