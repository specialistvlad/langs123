// The topic's shape and voice: each rule passes the fixture and names its written case.
import { expect, test } from "bun:test";
import type { Block } from "../../generated/library-v1.ts";
import { lintCase } from "./case.ts";
import { sentences, wordCount } from "./shape.ts";

const tour = { language: "en" as const, tour: { page: ["page"], topic: ["topic"], guide: ["guide"], course: ["course"] } };

test("the fixture holds every rule of the shape and the voice", () => {
  for (const rule of ["SH-01", "SH-03", "SH-08", "SH-12", "SH-16", "SH-18", "VO-01", "VO-04", "VO-05"]) {
    expect(lintCase(rule, undefined, { words: [tour] })).toEqual([]);
  }
});

test("SH-01: a title of more than six words, or twelve Japanese characters", () => {
  expect(lintCase("SH-01", (c) => (c.source.title.text = "Modal verbs in the past with their perfect forms"))).toEqual([
    "title: the title runs past six words",
  ]);
  expect(lintCase("SH-01", (c) => c.language("ja", { title: "過去の助動詞と完了形のすべての使い方" }))).toEqual([
    "title: the title runs past 12 characters",
  ]);
});

test("SH-03: a definition of two sentences, too long, without its full stop or capital", () => {
  expect(lintCase("SH-03", (c) => (c.source.definition.text = "the letters and their names. Used to spell words aloud"))).toEqual([
    "def: the definition is one sentence",
    "def: the definition ends with a full stop",
    "def: the definition starts with a capital letter",
  ]);
  expect(lintCase("SH-03", (c) => (c.source.definition.text = `${"Long ".repeat(40)}words.`))).toEqual([
    "def: the definition holds at most 160 characters",
  ]);
  expect(lintCase("SH-03", (c) => c.language("ja", { def: "文字にはそれぞれ名前があります" }))).toEqual([
    "def: the definition ends with 。",
  ]);
});

test("SH-08: an opening that speaks of the page", () => {
  expect(lintCase("SH-08", (c) => (c.source.definition.text = "Every letter on one page, with its name."), { words: [tour] })).toEqual([
    'def: the opening speaks of the subject, not of "page"',
  ]);
});

test("SH-12: an essence line that opens no subtopic, and a subtopic no line opens", () => {
  expect(lintCase("SH-12", (c) => c.source.essence.splice(2, 1, { id: "ess.x", to: "nowhere", form: "x" }))).toEqual([
    "ess.x: no subtopic is nowhere",
    "forms: no essence line opens the subtopic",
  ]);
});

test("SH-16: two facts in a row, and an example before its fact", () => {
  const fact: Block = { id: "names.fact2", type: "fact", text: [{ id: "names.fact2.1", text: "A second fact." }] };
  expect(lintCase("SH-16", (c) => c.source.subtopics[0]?.blocks.splice(1, 0, fact))).toEqual([
    "names: the subtopic gives the example of names.fact in the block after it",
  ]);
  expect(lintCase("SH-16", (c) => c.source.subtopics[1]?.blocks.reverse())).toEqual([
    "forms: the subtopic opens with its fact",
    "forms: the subtopic gives the example of forms.fact in the block after it",
  ]);
  expect(
    lintCase("SH-16", (c) => {
      c.course("en", "en", []);
    }),
  ).toEqual([]);
});

test("SH-18: a subtopic of two whys", () => {
  const why: Block = { id: "names.why2", type: "why", text: [{ id: "names.why2.1", text: "Another reason." }] };
  expect(lintCase("SH-18", (c) => c.source.subtopics[0]?.blocks.push(why))).toEqual(["names: the subtopic holds at most one why"]);
});

test("VO-01: a sentence of more than 20 words, or 50 Japanese characters", () => {
  const long =
    "In most of Latin America an action finished earlier today takes the preterite and Andean Spanish takes the perfect as Spain does.";
  expect(
    lintCase(
      "VO-01",
      (c) => (((c.source.subtopics[0]?.blocks[2] as { text: { text: string }[] }).text[0] as { text: string }).text = long),
    ),
  ).toEqual([`names.why.1: a sentence runs past 20 words: ${long}`]);
  expect(
    lintCase("VO-01", (c) =>
      c.language("ja", {
        "names.why.1": "名前があるので、文字を声に出して言うことができ、つづりを伝えたり聞き取ったりすることも簡単にできるようになります。",
      }),
    ),
  ).toHaveLength(1);
});

test("VO-04: a sentence that speaks of the guide", () => {
  expect(
    lintCase("VO-04", (c) => (c.uk.text["names.why.1"] = "This guide names each letter."), {
      words: [{ language: "uk", tour: { guide: ["guide"] } }],
    }),
  ).toEqual(['names.why.1: the sentence speaks of the subject, not of "guide"']);
});

test("VO-05: a level code in a sentence", () => {
  expect(lintCase("VO-05", (c) => (c.source.title.text = "The letters at A1"))).toEqual([
    "title: the level A1 stands in the level field alone",
  ]);
});

test("sentences end at . ! ? and their Japanese forms; words are runs of letters and digits", () => {
  expect(sentences("One: two; three. Four? «Five!» Six")).toEqual(["One: two; three.", "Four?", "«Five!»", "Six"]);
  expect(sentences("一つ。二つ！")).toEqual(["一つ。", "二つ！"]);
  expect(wordCount("I — work 9 to 5.")).toBe(5);
});
