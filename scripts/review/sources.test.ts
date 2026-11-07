// The sources' folder beside a course (M6): read per course with its files checked; the passages a request carries
// under each rule, the words the lists lack by element, and the steps before a topic from the index; the requests
// asking the rules the folder gives their input, the others pending with the input named.
import { afterAll, expect, test } from "bun:test";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { fixture } from "../v1/fixture.ts";
import { typedLibrary } from "../v1/library.ts";
import { readLibrary, SAMPLES_ROOT } from "../v1/load.ts";
import { type Indexed, indexRequest } from "./index-request.ts";
import { review } from "./index.ts";
import { sourceRequest } from "./request.ts";
import { indexSources, passagesFor, readSources, stepsBefore, topicSources } from "./sources.ts";
import { scripted } from "./stand-in.ts";

const catalog = await readRules(RULES_FILE);
const scratch = await mkdtemp(join(tmpdir(), "sources-"));
const folder = join(scratch, "sources");
afterAll(async () => {
  await rm(scratch, { recursive: true });
});
const write = async (course: string, name: string, lines: string[]): Promise<void> => {
  await mkdir(join(folder, course), { recursive: true });
  await Bun.write(join(folder, course, name), `${lines.join("\n")}\n`);
};
const head = (id: string, rules: string) => [
  `id: ${id}`,
  `name: The ${id}`,
  "licence: CC BY 4.0",
  `url: https://example.org/${id}`,
  `for: [${rules}]`,
];
await write("en", "profile.yaml", [
  ...head("profile", "IX-11, IX-14"),
  "passages:",
  '  - { id: letters-entry, ref: "A1, letters", topics: [letters], text: The learner can name the letters of the alphabet and spell words aloud. }',
  '  - { id: letters-list, ref: "appendix 1", topics: [letters], items: [A, B, C] }',
]);
await write("en", "vocabulary.yaml", [
  "source: [grade-1, cefr-j]",
  "levels:",
  "  A0: [the, letter, name, a, each, has, as, its, by, is, of, differ, variety, let, be, say, and, with, are]",
  "  A1: [verb, add, after, person, singular, plural, first, keep, one, form, read]",
  "  A2: [alphabet]",
  "  B1: [vowel]",
]);
await write("es", "pcic.yaml", [
  ...head("pcic", "NO-04, IX-11"),
  "passages:",
  '  - { id: pronombres-a1, ref: "Gramática 7.1, A1", topics: [subject-pronouns], text: "Pronombres personales sujeto: yo, tú, él, ella, usted." }',
]);

// The fixture's course with its index, the letters placed second at A0 and third at A1.
function indexed(): Indexed {
  const { library } = typedLibrary(fixture().files);
  const [course] = library.courses;
  if (course?.index === undefined) throw new Error("the fixture holds a course with its index");
  const entry = course.index.data.sections[0]?.topics[0];
  if (entry !== undefined) entry.path = { A0: 2, A1: 3 };
  return { ...course, index: course.index };
}

test("the folder is read per course, each file checked; no folder or no course gives nothing", async () => {
  expect(await readSources(undefined, "en")).toBeUndefined();
  expect(await readSources(folder, "fr")).toBeUndefined();
  const en = await readSources(folder, "en");
  expect(en?.files.map((f) => [f.id, f.for, f.passages.length])).toEqual([["profile", ["IX-11", "IX-14"], 2]]);
  expect(en?.vocabulary?.source).toEqual(["grade-1", "cefr-j"]);
  expect(en?.vocabulary?.levels["A2"]).toEqual(["alphabet"]);
  const bad: [string[], string][] = [
    [["id: bad"], "bad.yaml lacks name, licence, url, for, passages"],
    [[...head("bad", ""), "passages:", "  - { id: p, ref: r, topics: [a] }"], "the passage p lacks text or items"],
    [[...head("bad", ""), "passages:", "  - { ref: r, text: t }"], "the passage ? lacks id, topics"],
  ];
  for (const [n, [lines, message]] of bad.entries()) {
    await write(`x${String(n)}`, "bad.yaml", lines);
    expect(readSources(folder, `x${String(n)}`)).rejects.toThrow(message);
  }
  await write("x9", "vocabulary.yaml", ["source: s"]);
  expect(readSources(folder, "x9")).rejects.toThrow("vocabulary.yaml lacks levels");
});

test("the passages under a rule, and the steps before a topic in the path", async () => {
  const en = await readSources(folder, "en");
  expect(passagesFor(en, "IX-14", "letters").map((p) => [p.source, p.passage.id])).toEqual([["profile", "letters-list"]]);
  expect(passagesFor(en, "IX-11", "letters").map((p) => p.passage.id)).toEqual(["letters-entry"]);
  expect(passagesFor(en, "NO-04", "letters")).toEqual([]);
  const { index } = indexed();
  expect(stepsBefore(index.data, "letters")).toEqual([]);
  expect(stepsBefore(index.data, "nowhere")).toBeUndefined();
  expect(stepsBefore(undefined, "letters")).toBeUndefined();
  index.data.sections[0]?.topics.push(
    { id: "sounds", subject: "The sounds", covers: ["vowels"], path: { A0: 3 }, status: "draft" },
    { id: "numbers", subject: "Numbers", covers: ["one to ten"], path: { A1: 1 }, status: "draft" },
    { id: "greetings", subject: "Greetings", covers: ["hello"], path: { A0: 1 }, status: "draft" },
  );
  expect(stepsBefore(index.data, "letters")).toEqual([{ id: "greetings", subject: "Greetings", covers: ["hello"] }]);
  expect(stepsBefore(index.data, "numbers")?.map((s) => s.id)).toEqual(["letters", "sounds", "greetings"]);
});

test("a topic's sources part gives SH-09, VO-03, FT-08 and IX-14 their input, the vocabulary by the words the lists lack; an index's gives IX-11", async () => {
  const en = await readSources(folder, "en");
  const course = indexed();
  const [topic] = course.topics;
  if (topic === undefined) throw new Error("the fixture holds a topic");
  const part = topicSources(en, course, topic);
  expect([...part.given].sort()).toEqual(["FT-08", "IX-14", "SH-09", "VO-03"]);
  expect(part.lines.slice(0, 2)).toEqual(["", "## Sources"]);
  expect(part.lines).toContain("- IX-14, the reference list ({list}) from profile (appendix 1): A; B; C");
  expect(part.lines).toContain(
    "- SH-09 and VO-03, the words of each element that the vocabulary of the levels to its own ({level}) lacks, the lists from grade-1, cefr-j:",
  );
  expect(part.lines).toContain("  - names.why.1 (A0): said");
  expect(part.lines).toContain("  - err.s.ja (A1): japanese");
  expect(part.asks).toEqual({ "SH-09": [], "VO-03": ["names.why.1", "err.a.uk", "err.s.ja"] });
  expect(part.lines).toContain(
    "- FT-08, the steps before this topic ({list}), each with its subject and what it covers: none, this is the first",
  );
  expect(part.notes).toEqual([]);
  const whole = {
    ...en,
    vocabulary: {
      source: "s",
      levels: {
        A0: [...(en?.vocabulary?.levels["A0"] ?? []), "said", "ukrainian", "read"],
        A1: [...(en?.vocabulary?.levels["A1"] ?? []), "japanese"],
      },
    },
  };
  const held = topicSources(whole as never, course, topic);
  expect(held.lines).toContain("  - none: every word stands in the lists");
  expect(held.notes).toEqual([
    "SH-09 and VO-03 hold by the lists: every word of the opening and the explanations stands in the vocabulary to its level.",
  ]);
  const short = topicSources({ ...whole, vocabulary: { source: "s", levels: { A0: ["the"] } } } as never, course, topic);
  expect(short.asks["VO-03"]).toEqual(["names.title", "names.fact.1", "names.z", "names.why.1", "err.a.rule", "err.a.uk"]);
  expect(short.notes).toEqual(["SH-09 and VO-03 wait on the vocabulary of A1 for the elements at those levels."]);
  expect(topicSources(undefined, { ...course, index: undefined } as never, topic)).toEqual({
    lines: [],
    given: new Set(),
    asks: {},
    notes: [],
  });
  const ix = indexSources(en);
  expect([...ix.given]).toEqual(["IX-11"]);
  expect([...ix.sourced]).toEqual(["letters"]);
  expect(ix.lines).toContain(
    "  - profile (A1, letters), for letters: The learner can name the letters of the alphabet and spell words aloud.",
  );
  expect(ix.lines.some((l) => l.includes("appendix 1"))).toBe(false);
  expect(indexSources(undefined)).toEqual({ lines: [], given: new Set(), sourced: new Set() });
});

test("the requests ask the rules the sources give their input, SH-09 and VO-03 of the elements with unknown words, the rest pending with the input named", async () => {
  const en = await readSources(folder, "en");
  const course = indexed();
  const [topic] = course.topics;
  if (topic === undefined) throw new Error("the fixture holds a topic");
  const r = sourceRequest(topic, course, catalog, {}, en);
  expect(r.pending).toEqual([]);
  expect(r.asked).toMatchObject({ "VO-03": 3, "IX-14": 1 });
  expect(r.asked["SH-09"]).toBeUndefined();
  expect(r.asked["FT-08"]).toBeGreaterThan(0);
  expect(r.prompt).toContain("## Sources\n- IX-14, the reference list");
  expect(r.prompt).toContain("- VO-03 [sentence], asked of names.why.1, err.a.uk, err.s.ja:");
  expect(r.notes).toBeUndefined();
  const ix = indexRequest(course, catalog, [], {}, en);
  expect(ix.asked).toEqual({ "IX-11": 1 });
  expect(ix.pending).toEqual([]);
  expect(ix.prompt).toContain("- IX-11 [sentence], asked of letters: Given source {passage}:");
  const es = await readSources(folder, "es");
  const { library } = typedLibrary(await readLibrary(SAMPLES_ROOT));
  const spanish = library.courses.find((c) => c.course === "es");
  const pronouns = spanish?.topics[0];
  if (spanish === undefined || pronouns === undefined) throw new Error("the samples hold the Spanish course");
  const sp = sourceRequest(pronouns, spanish, catalog, {}, es);
  expect(sp.asked["NO-04"]).toBeGreaterThan(0);
  expect(sp.pending).toEqual(["SH-09", "VO-03", "IX-14"]);
  expect(sp.inputs["IX-14"]).toBe("the reference list");
  expect(sp.prompt).toContain("- NO-04, the entry ({extract}) from pcic (Gramática 7.1, A1): Pronombres personales sujeto: yo");
  expect(sourceRequest(pronouns, spanish, catalog).pending).toEqual(["SH-09", "VO-03", "NO-04", "IX-14"]);
});

test("review reads the folder per course and gives the requests its sources", async () => {
  const root = join(scratch, "samples");
  await cp(SAMPLES_ROOT, root, { recursive: true, filter: (from) => basename(from) !== "review.yaml" });
  const options = {
    runner: scripted({ index: [[], []] }),
    writer: { session: "w", model: "m" },
    model: "m",
    date: "2026-11-06",
    out: join(scratch, "out"),
  };
  const [done] = await review(root, ["es"], { ...options, sources: folder });
  expect(done?.requests[0]?.request.asked).toEqual({ "IX-11": 1 });
  expect(done?.requests[0]?.runs).toHaveLength(2);
}, 30_000);
