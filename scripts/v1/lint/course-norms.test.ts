// The norms of each course's own text: every rule names its written case in a course of its language, and passes
// the text written as the rule says.
import { expect, test } from "bun:test";
import type { Block, ExampleBlock, WordLists } from "../../generated/library-v1.ts";
import { type Case, lintCase } from "./case.ts";

const ES: WordLists = { language: "es", vosotros: ["vosotros", "sois"], voseo: ["vos", "sos"] };
const KANJI = {
  source: { name: "A list", licence: "CC BY 4.0", url: "https://example.org" },
  A1: [{ word: "日本", reading: "にほん" }],
  A2: [{ word: "経験", reading: "けいけん" }],
};
// The fixture's first example, and its example block, set as the course's own text.
const example = (c: Case): ExampleBlock => c.source.subtopics[1]?.blocks[2] as ExampleBlock;
const writes =
  (text: string, variety?: string) =>
  (c: Case): void => {
    Object.assign(example(c).items[0] ?? {}, { text }, variety === undefined ? {} : { variety });
  };
// The changes given, one after another.
const all =
  (...changes: ((c: Case) => unknown)[]) =>
  (c: Case): void => {
    for (const change of changes) change(c);
  };
const fact = (c: Case): { text: { text: string }[]; variety?: string } => c.source.subtopics[0]?.blocks[0] as never;
const entry = (c: Case): { script?: string } => c.index.sections[0]?.topics[0] as never;

test("NO-02: English IPA is British; a US value stands in an en-US variant", () => {
  const ipa =
    (value: string) =>
    (c: Case): void => {
      Object.assign(c.source.essence[0] ?? {}, { ipa: value });
    };
  expect(lintCase("NO-02", ipa("oʊ"))).toEqual(["ess.a: the IPA is British; a US value stands in an en-US variant"]);
  expect(lintCase("NO-02", ipa("ɑː"))).toEqual([]);
  expect(
    lintCase("NO-02", (c) => (fact(c).text[0] = { id: "names.fact.1", text: "The name of {term R} is {ipa ɑːr}." } as never)),
  ).toHaveLength(1);
  expect(
    lintCase(
      "NO-02",
      (c) =>
        (fact(c).text[0] = { id: "names.fact.1", text: "The name of {term O} is {ipa {variant en-GB əʊ} {variant en-US oʊ}}." } as never),
    ),
  ).toEqual([]);
});

test("NO-09 and NO-10: Ukrainian marks stress in its course's examples, and nowhere in its prose", () => {
  const uk = (c: Case): void => {
    c.course("uk", "uk");
  };
  expect(lintCase("NO-09", all(uk, writes("Я читаю кни́жку.")))).toEqual(["forms.office: читаю marks its stress"]);
  expect(lintCase("NO-09", all(uk, writes("Я чита́ю кни́жку.")))).toEqual([]);
  expect(
    lintCase(
      "NO-09",
      all(uk, (c) => (fact(c).text[0] = { id: "names.fact.1", text: "Дієслово {term читаю} має закінчення." } as never)),
    ),
  ).toEqual(["names.fact.1: читаю marks its stress"]);
  expect(lintCase("NO-10", (c) => (c.uk.text["names.title"] = "На́зви"))).toEqual([
    "names.title: a title or an explanation is written in plain letters",
  ]);
});

test("NO-11: a transliteration stands in the three script topics alone", () => {
  const translit = (c: Case): void => {
    c.course("uk", "uk");
    writes("{target п’ять} {translit p’iat’}")(c);
  };
  expect(lintCase("NO-11", translit)).toEqual([]);
  expect(
    lintCase(
      "NO-11",
      all(translit, (c) => Reflect.deleteProperty(entry(c), "script")),
    ),
  ).toEqual(["forms.office: a transliteration stands in the alphabet, the sounds and the soft sign alone"]);
});

test("NO-22 to NO-26: Japanese gives romaji in its kana topics, its own script beyond them, readings on every kanji, kana at A0 and the kanji of each level", () => {
  const ja =
    (text: string) =>
    (c: Case): void => {
      c.course("ja", "en");
      writes(text)(c);
    };
  const kana =
    (text: string) =>
    (c: Case): void => {
      ja(text)(c);
      entry(c).script = "kana";
    };
  expect(lintCase("NO-22", kana("{target か}さ"))).toContain("forms.office: an example of a kana topic gives its romaji");
  expect(lintCase("NO-22", kana("{target か}さ {romaji kasa}"))).not.toContain("forms.office: an example of a kana topic gives its romaji");
  expect(lintCase("NO-23", ja("watashi wa {target hatarakimasu}。"))).toContain("forms.office: Japanese is written in Japanese script");
  expect(lintCase("NO-24", ja("{target 食}べます。"))).toEqual(["forms.office: a kanji carries its reading in a kanji mark"]);
  expect(lintCase("NO-24", ja("{target {kanji た 食}べます}。"))).toEqual([]);
  expect(
    lintCase(
      "NO-24",
      all(
        ja("{target {kanji た 食}べます}。"),
        (c) => (fact(c).text[0] = { id: "names.fact.1", text: "The verb {term 食べる} ends in る." } as never),
      ),
    ),
  ).toEqual(["names.fact.1: a kanji carries its reading in a kanji mark"]);
  expect(
    lintCase(
      "NO-25",
      all(ja("がくせいです。"), (c) => Object.assign(c.source.subtopics[1] ?? {}, { level: "A0" }), writes("{kanji がくせい 学生}です。")),
    ),
  ).toEqual(["forms.office: an A0 example is written in kana"]);
  expect(lintCase("NO-26", ja("{kanji にほん 日本}です。"), { kanji: KANJI })).toEqual([]);
  expect(lintCase("NO-26", ja("{kanji けいけん 経験}です。"), { kanji: KANJI })).toEqual([
    "forms.office: 経験 stands above the kanji of A1",
  ]);
});

test("NO-29 and NO-31: Spanish vosotros carries es-ES, and voseo stands in an es-419 fact block", () => {
  const es = (c: Case): void => {
    c.course("es", "es", ["es-419", "es-ES"]);
  };
  expect(lintCase("NO-29", all(es, writes("¿{target Vosotros} sois de aquí?")), { words: [ES] })).toEqual([
    "forms.office: vosotros belongs to es-ES and carries it",
    "forms.office: sois belongs to es-ES and carries it",
  ]);
  expect(lintCase("NO-29", all(es, writes("¿{target Vosotros} sois de aquí?", "es-ES")), { words: [ES] })).toEqual([]);
  expect(lintCase("NO-29", all(es, writes("{target {variant es-419 Ustedes} {variant es-ES Vosotros}}.")), { words: [ES] })).toEqual([]);
  const vos = { id: "names.fact.1", text: "En Argentina, {term vos} ocupa el lugar de tú." };
  expect(
    lintCase(
      "NO-31",
      all(es, (c) => (fact(c).text[0] = vos as never)),
      { words: [ES] },
    ),
  ).toEqual(["names.fact.1: vos stands in an element carrying es-419"]);
  expect(
    lintCase(
      "NO-31",
      all(
        es,
        (c) => (fact(c).text[0] = vos as never),
        (c) => (fact(c).variety = "es-419"),
      ),
      { words: [ES] },
    ),
  ).toEqual([]);
});

test("NO-33: the affricates of Québec carry fr-CA", () => {
  const fr =
    (variety?: string) =>
    (c: Case): void => {
      c.course("fr", "fr", ["fr-FR", "fr-CA"]);
      fact(c).text[0] = { id: "names.fact.1", text: "Au Québec, tu se dit {ipa tsy}." } as never;
      if (variety !== undefined) fact(c).variety = variety;
    };
  expect(lintCase("NO-33", fr())).toEqual(["names.fact.1: the affricates of tu and dis carry fr-CA"]);
  expect(lintCase("NO-33", fr("fr-CA"))).toEqual([]);
});

test("NO-34 and NO-51: a swap holds each variety's form once, side by side, the forms differing", () => {
  const ipa =
    (value: string) =>
    (c: Case): void => {
      Object.assign(c.source.essence[1] ?? {}, { ipa: value });
    };
  expect(lintCase("NO-34", ipa("{variant en-GB zed} zed"))).toEqual([
    "ess.z: a swap holds the form of each variety, en-GB and en-US, side by side",
  ]);
  expect(
    lintCase("NO-34", (c) => (fact(c).text[0] = { id: "names.fact.1", text: "Say at the weekend / on the weekend." } as never)),
  ).toEqual(["names.fact.1: each variety's form stands in its own variant, with no / between them"]);
  expect(lintCase("NO-51", ipa("{variant en-GB zed} {variant en-US zed}"))).toEqual([
    "ess.z: a form both varieties share stays plain text",
  ]);
  const block: Block = {
    id: "names.example",
    type: "example",
    items: [{ id: "names.ex", text: "{target a}t {variant en-GB the weekend} {variant en-US the weekend}" }],
  };
  expect(lintCase("NO-51", (c) => c.source.subtopics[0]?.blocks.push(block))).toHaveLength(1);
});
