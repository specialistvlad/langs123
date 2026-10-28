// A topic's text piece by piece: explanations and examples with the ids their translations take, forms without;
// a language file's translations, own blocks, own errors and own speakers' reasons.
import { expect, test } from "bun:test";
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import { SOURCE, UK } from "./fixture.ts";
import { languagePieces, sourcePieces, translated } from "./texts.ts";

test("sourcePieces reads the head, the essence, every block and the errors in reading order", () => {
  const pieces = sourcePieces(SOURCE);
  expect(pieces.slice(0, 2).map((p) => p.id)).toEqual(["title", "def"]);
  expect(pieces.filter((p) => p.of === "ess.a").map((p) => [p.kind, p.text, p.subtopic])).toEqual([
    ["form", "A", "names"],
    ["form", "a", "names"],
    ["form", "eɪ", "names"],
  ]);
  expect(pieces.find((p) => p.id === "names.z")).toMatchObject({ kind: "explanation", block: "names.list", subtopic: "names" });
  expect(pieces.find((p) => p.id === "ex.apple")).toMatchObject({ kind: "course", text: "{target a}pple" });
  expect(pieces.find((p) => p.id === "forms.us")).toMatchObject({ kind: "course", variety: "en-GB" });
  expect(pieces.filter((p) => p.of === "forms.third").map((p) => [p.text, p.variety])).toEqual([
    ["he", undefined],
    ["He {target works}.", "en-GB"],
    ["They work.", undefined],
  ]);
  expect(pieces.find((p) => p.id === "forms.first.name")).toMatchObject({ kind: "explanation", text: "first person" });
  expect(pieces.filter((p) => p.block === "err.a").map((p) => p.kind)).toEqual(["form", "form", "explanation", "explanation"]);
  expect(pieces.find((p) => p.id === "err.s.right")).toMatchObject({ kind: "course", subtopic: "forms" });
});

test("translated holds every explanation and example, and no form", () => {
  const ids = translated(SOURCE).map((p) => p.id);
  expect(ids).toContain("forms.col.sg");
  expect(ids).toContain("err.s.ja");
  expect(translated(SOURCE).every((p) => p.kind !== "form")).toBe(true);
});

test("languagePieces reads translations, a split, own blocks, own errors and own speakers' reasons", () => {
  const file: TopicLanguageFile = {
    ...UK,
    errors: [
      {
        id: "uk.err.1",
        in: "names",
        wrong: "w",
        right: "r",
        rule: { id: "uk.err.1.rule", text: "Правило." },
        speakers: { uk: { id: "uk.err.1.uk", text: "Причина." } },
      },
      {
        id: "uk.err.2",
        in: "names",
        wrong: "w",
        right: { id: "uk.err.2.right", text: "Right.", tr: "Правильно." },
        rule: { id: "uk.err.2.rule", text: "Правило." },
        speakers: { uk: { id: "uk.err.2.uk", text: "Причина." } },
      },
    ],
    speakers: { "err.s": { id: "uk.err.s.uk", text: "Українські дієслова теж мають одну форму в питанні." } },
  };
  const pieces = languagePieces(file);
  expect(pieces.filter((p) => p.id === "names.fact.1").map((p) => p.text)).toEqual([
    "Кожна літера має назву.",
    "{term A} має назву {ipa eɪ}.",
  ]);
  expect(pieces.filter((p) => p.id === "uk.names.box").map((p) => [p.kind, p.text])).toEqual([
    ["course", "{target b}ox"],
    ["explanation", "коробка"],
  ]);
  expect(pieces.find((p) => p.id === "uk.names.fact.1")).toMatchObject({ subtopic: "names", block: "uk.names.fact" });
  expect(pieces.filter((p) => p.block === "uk.err.1").map((p) => p.kind)).toEqual(["form", "form", "explanation", "explanation"]);
  expect(pieces.filter((p) => p.block === "uk.err.2").map((p) => p.kind)).toEqual([
    "form",
    "course",
    "explanation",
    "explanation",
    "explanation",
  ]);
  expect(pieces.at(-1)).toMatchObject({ id: "uk.err.s.uk", kind: "explanation" });
  expect(languagePieces({ language: "uk", nativeReview: false, text: {} })).toEqual([]);
});
