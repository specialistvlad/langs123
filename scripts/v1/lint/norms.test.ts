// Each language's writing and words: every rule names its written case in a text of its language, and passes the
// same text written as the rule says.
import { expect, test } from "bun:test";
import type { WordLists } from "../../generated/library-v1.ts";
import { type Case, lintCase } from "./case.ts";

const words: WordLists[] = [
  { language: "en", spellings: [{ wrong: "color", right: "colour" }] },
  { language: "de", spellings: [{ wrong: "Strasse", right: "Straße" }] },
  { language: "it", spellings: [{ wrong: "citta", right: "città" }], address: ["Lei"] },
  { language: "vi", spellings: [{ wrong: "tieng", right: "tiếng" }] },
  { language: "tr", names: ["İstanbul"], address: ["sen", "sana"] },
  { language: "uk", address: ["ти", "твій"] },
  { language: "es", address: ["usted"] },
  { language: "pt", address: ["tu"], topic: { word: "tópico", synonyms: ["tema", "temas"] } },
  { language: "fr", address: ["tu"] },
  { language: "pl", address: ["Pan", "Twój"] },
  { language: "id", address: ["kamu"] },
  { language: "ja", address: ["あなた"] },
];
// A sentence of a language: the fixture's why, translated into it.
const said = (rule: string, language: string, text: string): string[] =>
  lintCase(rule, (c) => c.language(language, { "names.why.1": text }), { words });

// Each rule, its language, the written case and the same text as the rule writes it.
const CASES: [string, string, string, string][] = [
  ["NO-05", "es", "Estás bien?", "¿Estás bien?"],
  ["NO-08", "uk", "Літера п'ять.", "Літера п’ять."],
  ["NO-15", "fr", "Le nom de l'école.", "Le nom de l’école."],
  ["NO-46", "it", "L'alfabeto.", "L’alfabeto."],
  ["NO-46", "tr", "Japonya'ya gidiyorum.", "Japonya’ya gidiyorum."],
  ["NO-16", "fr", 'Le mot "nom".', "Le mot « nom »."],
  ["NO-17", "fr", "Devant p, b, m: /m/.", "Devant p, b, m : le son."],
  ["NO-52", "de", 'Das Wort "Name".', "Das Wort „Name“."],
  ["NO-52", "de", "Die Strasse.", "Die Straße."],
  ["NO-54", "pl", 'Słowo "imię".', "Słowo „imię”."],
  ["NO-19", "ja", "あした 学校に 行きます。", "あした学校に行きます。"],
  ["NO-20", "ja", "きょうは月曜日です.", "きょうは月曜日です。"],
  ["NO-57", "ja", "説明（せつめい）を読みます。", "説明を読みます。"],
  ["NO-48", "es", "Si hubiera llegado antes...", "Si hubiera llegado antes…"],
  ["NO-53", "it", "La citta.", "La città."],
  ["NO-56", "vi", "Chữ cái tieng Anh.", "Chữ cái tiếng Anh."],
  ["NO-55", "tr", "İstanbulda yaşıyorum.", "İstanbul’da yaşıyorum."],
  ["NO-35", "uk", "Ти бачиш літеру.", "Ви бачите літеру."],
  ["NO-36", "es", "Usted ve la letra.", "Ves la letra."],
  ["NO-37", "pt", "Tu vês a letra.", "Você vê a letra."],
  ["NO-38", "fr", "Tu vois la lettre.", "Vous voyez la lettre."],
  ["NO-40", "it", "Come Lei vede, la lettera è A.", "Come vedi, la lettera è A."],
  ["NO-41", "pl", "Czy Pan widzi literę?", "Czy widzisz literę?"],
  ["NO-42", "tr", "Bu sana yakın.", "Bu size yakın."],
  ["NO-43", "id", "Huruf ini dekat dengan kamu.", "Huruf ini dekat dengan Anda."],
  ["NO-58", "ja", "あなたは文字を見ます。", "文字を見ます。"],
];

for (const [rule, language, wrong, right] of CASES) {
  test(`${rule} in ${language}: "${wrong}" is named, "${right}" passes`, () => {
    expect(said(rule, language, wrong).length).toBeGreaterThan(0);
    expect(said(rule, language, right)).toEqual([]);
  });
}

test("NO-35 to NO-44: the forms of address are read in explanations alone, and a capitalised entry past a sentence's first word", () => {
  const exampleTr = (c: Case): void => {
    c.uk.text["forms.office"] = "Ти працюєш в офісі.";
  };
  expect(lintCase("NO-35", exampleTr, { words })).toEqual([]);
  expect(said("NO-41", "pl", "Twój alfabet ma litery.")).toEqual([]);
  expect(said("NO-41", "pl", "To jest Twój alfabet.")).toEqual(['names.why.1: the explanation addresses the reader without "Twój"']);
  expect(said("NO-35", "uk", "Займенник {term ти} звертається до однієї людини.")).toEqual([]);
  const reason = (c: Case): void => {
    c.uk.speakers = { "err.s": { id: "uk.err.s.uk", text: "Ти кажеш так українською." } };
  };
  expect(lintCase("NO-35", reason, { words })).toEqual(['uk.err.s.uk: the explanation addresses the reader without "ти"']);
});

test("NO-47: English writes the apostrophe as ', and an English term inside another language is left out of it", () => {
  expect(lintCase("NO-47", (c) => (c.source.title.text = "Tanaka-san’s letters"))).toEqual(["title: English writes the apostrophe as '"]);
  expect(said("NO-08", "uk", "Слово {term don't}.")).toEqual([]);
});

test("NO-01: a US spelling stands only inside an en-US variant", () => {
  const example =
    (text: string) =>
    (c: Case): void => {
      ((c.source.subtopics[1]?.blocks[2] as { items: { text: string }[] }).items[0] as { text: string }).text = text;
    };
  expect(lintCase("NO-01", example("The {target color} of the sky."), { words })).toEqual(['forms.office: "color" is spelled colour']);
  expect(lintCase("NO-01", example("The {variant en-GB colour} {variant en-US color} of the sky."), { words })).toEqual([]);
});

test("NO-45: the interface names a topic with the language's own word", () => {
  const named = [...words, { language: "en" as const, topic: { word: "topic", synonyms: ["lesson"] }, tour: { topic: ["topics"] } }];
  const wording = { count: { en: "{n} topics", pt: "{n} temas" }, theme: { en: "Theme", pt: "Tema" } };
  expect(lintCase("NO-45", undefined, { words: named, beside: { wording } })).toEqual(['count.pt: a topic is tópico, not "temas"']);
  expect(lintCase("NO-45", undefined, { words: named, beside: { wording: { count: { en: "{n} topics", pt: "{n} tópicos" } } } })).toEqual(
    [],
  );
});
