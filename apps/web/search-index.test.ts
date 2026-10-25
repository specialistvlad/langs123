// The Home search, held by the cases of search-cases.json, which another app's tests hold too: words compare
// without case and marks and split as the search reads them; the index of the fixture, a slice of the library as the
// Japanese Home reads it, weighs each word by where it stands and how few topics hold it; a term reads as itself, as
// the words it starts while typed, or as the words one letter away; a query ranks the topics its words weigh most in,
// titles first; the filters narrow them to a course and the levels up to one; and each query shows its rows as the page
// does. Then what the website alone does: each word keeps its best topics, in parts by first letter.
import { expect, test } from "bun:test";
import { boldRuns, captionOf, filtered, find, results, type Topic } from "./search-find.ts";
import {
  BEST,
  fold,
  type Index,
  indexOf,
  oneEdit,
  partOf,
  partsOf,
  readings,
  scores,
  tokens,
  type TopicText,
  type TopicWords,
  wordsOf,
} from "./search-index.ts";
import { SEARCH_CASES, searchData } from "./pages/home-search.ts";

// A topic as the Japanese Home's search reads it: its texts, and the fields of its row the page shows.
interface Fixture extends TopicText {
  id: string;
  course: string;
  levels: string[];
  other: string;
}
interface Cases {
  levels: string[];
  explained: string;
  fixture: Fixture[];
  index: Index;
  fold: [string, string][];
  tokens: [string, string[]][];
  oneEdit: [string, string, boolean][];
  readings: { term: string; last: boolean; words: [string, number][] }[];
  scores: { terms: string[]; order: number[] }[];
  find: { query: string; titles: string[] }[];
  filters: { query: string; course: string; upTo: string; titles: string[] }[];
  marked: { text: string; terms: string[]; bold: string[] }[];
  results: { query: string; course: string; upTo: string; rows: { id: string; caption: string; lead: [string, boolean][] }[] }[];
}
const cases = (await Bun.file(SEARCH_CASES).json()) as Cases;
const index = indexOf(cases.fixture.map(wordsOf));
const words = Object.keys(index);
const topics: Topic[] = cases.fixture.map((t, order) => ({
  title: t.title,
  url: "",
  levels: t.levels,
  summary: t.lead,
  flag: "",
  course: t.course,
  other: t.other,
  otherLang: "",
  code: t.course,
  entry: {},
  id: t.id,
  order,
  t: fold(t.title),
}));

test("words compare without case, accents and marks, kana keeping their voicing marks", () => {
  for (const [input, output] of cases.fold) expect(fold(input)).toBe(output);
});
test("words split at anything not a letter or digit, and a run of Japanese reads as its overlapping pairs", () => {
  for (const [input, output] of cases.tokens) expect(tokens(input)).toEqual(output);
});
test("the fixture's index is the one the cases hold", () => {
  expect(index).toEqual(cases.index);
});
test("one letter added, dropped or changed is one edit away; two are not", () => {
  for (const [a, b, near] of cases.oneEdit) expect([a, b, oneEdit(a, b)]).toEqual([a, b, near]);
});
test("a term reads as itself, as the words it starts while typed, or as the words one letter away in its part", () => {
  for (const r of cases.readings) expect([r.term, readings(index, words, r.term, r.last)]).toEqual([r.term, r.words]);
});
test("a query ranks the topics its words weigh most in, counting each term once", () => {
  for (const s of cases.scores) {
    const order = [...scores(index, words, s.terms)].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([t]) => t);
    expect([s.terms, order]).toEqual([s.terms, s.order]);
  }
  expect(scores({}, [], ["what"]).size).toBe(0);
});
test("a query finds the titles holding it first, then the rest by the index", () => {
  for (const f of cases.find) {
    expect([f.query, find(topics, index, words, tokens(f.query)).map((t) => t.title)]).toEqual([f.query, f.titles]);
  }
});
test("the filters narrow the topics to a course and to the levels up to one", () => {
  for (const f of cases.filters) {
    const found = filtered(find(topics, index, words, tokens(f.query)), { course: f.course, upTo: f.upTo }, cases.levels).map(
      (t) => t.title,
    );
    expect([f.query, found]).toEqual([f.query, f.titles]);
  }
});

test("a text shows each place a term appears in bold, cut from the original with its marks", () => {
  for (const m of cases.marked) {
    const runs = boldRuns(m.text, m.terms);
    expect(runs.map(([run]) => run).join("")).toBe(m.text);
    expect([m.text, runs.filter(([, bold]) => bold).map(([run]) => run)]).toEqual([m.text, m.bold]);
  }
});

test("a query shows, in order, each topic found within the filters, the language it opens in, and its lead with the terms in bold", () => {
  for (const r of cases.results) {
    const shown = results(topics, index, words, r.query, { course: r.course, upTo: r.upTo }, cases.levels, cases.explained);
    expect([r.query, shown.map(({ topic, caption, lead }) => ({ id: topic.id, caption, lead }))]).toEqual([r.query, r.rows]);
  }
  const english = { ...topics[0], other: "English" } as Topic;
  expect([captionOf("Explained in {name:lower}", english), captionOf("Read in {name}", english)]).toEqual([
    "Explained in english",
    "Read in English",
  ]);
  expect(captionOf("Explained in {name}", { ...english, other: "" })).toBe("");
});

test("a word keeps the topics it weighs most in, at most BEST", () => {
  // Topic i says "shared" i + 1 times in a body of the same length; as many topics again never say it.
  const body = (i: number): string => `${"shared ".repeat(i + 1)}${"filler ".repeat(BEST + 4 - i)}`;
  const word = (title: string, text: string): TopicWords => ({ title: tokens(title), lead: [], strong: [], body: tokens(text) });
  const holding = Array.from({ length: BEST + 4 }, (_, i) => word(`Topic ${String(i)}`, body(i)));
  const other = Array.from({ length: BEST + 4 }, (_, i) => word(`Other ${String(i)}`, "filler ".repeat(BEST + 5)));
  const many = indexOf([...holding, ...other]);
  expect(many["shared"]?.[0]).toBe(BEST + 4);
  expect(((many["shared"] ?? []).length - 1) / 2).toBe(BEST);
  expect(many["shared"]?.[1]).toBe(BEST + 3);
});
test("the index comes in parts by first letter, each named by its code point in hexadecimal", () => {
  expect(partOf("what")).toBe("77");
  expect(partOf("щоб")).toBe("449");
  const parts = partsOf(index);
  expect(Object.keys(parts["77"] ?? {}).every((w) => w.startsWith("w"))).toBe(true);
  expect(Object.keys(parts["77"] ?? {})).toContain("went");
  expect(Object.values(parts).reduce((n, p) => n + Object.keys(p).length, 0)).toBe(words.length);
});

test("the whole library's search data in an explanation language: a row per written topic, its id last, and the index of their words", async () => {
  const data = await searchData("en");
  const ids = data.topics.map((row) => row[11]);
  expect([
    ids.includes("en.verbs.irregular-verbs-table"),
    ids.includes("ja.sentence-basics.desu"),
    data.index["went"] !== undefined,
  ]).toEqual([true, true, true]);
}, 30_000);
