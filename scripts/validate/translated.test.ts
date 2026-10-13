// npm run check names the parts of a topic whose source text changed since its translations were stamped,
// and asks for a stamp a translation lacks; text in the other languages, inside an example too, and rows
// for other speakers leave the fingerprint as it is.
import { describe, expect, test } from "bun:test";
import { changedParts, fingerprint, SOURCE, sourceParts } from "../fingerprint.ts";
import { EXPLAIN_CODES, type ErrorsBlock, type ListBlock, type Topic } from "../lib.ts";
import { problemsAfter, SAMPLE, sampleBlocks } from "../sample-topic.ts";
import { checkTranslated } from "./topic-translated.ts";

// The explanation languages that translate the source, and the sample stamped as up to date in each, then changed.
const others = EXPLAIN_CODES.filter((e) => e !== SOURCE);
const stamped = (change: (t: Topic) => void): string[] =>
  problemsAfter((t) => {
    t.translated = Object.fromEntries(others.map((e) => [e, fingerprint(SAMPLE)]));
    change(t);
  }, checkTranslated);

describe("the fingerprint", () => {
  test("holds one hash per part: the title and summary, the cheatsheet, each section", () => {
    expect(sourceParts(SAMPLE)).toHaveLength(2 + SAMPLE.sections.length);
    expect(fingerprint(SAMPLE)).toMatch(/^[0-9a-f]{6}( [0-9a-f]{6})*$/);
    expect(fingerprint(structuredClone(SAMPLE))).toBe(fingerprint(SAMPLE));
  });
  test("names each changed part as the page numbers it", () => {
    const t = structuredClone(SAMPLE);
    t.summary.lead.en = "Another lead.";
    const [item] = (sampleBlocks(t)[1] as ListBlock).items;
    if (item) item.ex = "Another example.";
    expect(changedParts(t, fingerprint(SAMPLE))).toEqual(["the title and summary", "01 One"]);
    expect(changedParts(t, `${fingerprint(SAMPLE)} 000000`)).toEqual(["the title and summary", "01 One", "1 section(s) removed"]);
    t.cheatsheet.content = [];
    expect(changedParts(t, fingerprint(SAMPLE))).toContain("00 Cheatsheet");
  });
});

describe("the check", () => {
  test("a stamped topic passes, and a missing stamp is asked for", () => {
    expect(stamped(() => undefined)).toEqual([]);
    expect(problemsAfter(() => undefined, checkTranslated)).toEqual(
      others.map(
        (e) => `translated has no "${e}" fingerprint: once the ${e} text is written, run npm run translated -- en.sample.topic ${e}`,
      ),
    );
  });
  test("a change to the source text names the part in every translation", () => {
    expect(
      stamped((t) => {
        t.title.en = "Another title";
      }),
    ).toEqual(
      others.map(
        (e) =>
          `the ${e} text predates the en text in the title and summary: bring it up to date, then run npm run translated -- en.sample.topic ${e}`,
      ),
    );
  });
  test("text in the other languages, and an error row for other speakers, leave the fingerprint as it is", () => {
    expect(
      stamped((t) => {
        t.title.uk = "Інша назва";
        (sampleBlocks(t)[3] as ErrorsBlock).rows.push({
          level: "A1",
          speakers: ["uk"],
          wrong: "Wrong.",
          right: "Right.",
          rule: { uk: "Правило." },
        });
      }),
    ).toEqual([]);
  });
  test("a translation added to a localized piece of an example, such as a slot's name, leaves the fingerprint as it is", () => {
    const t = structuredClone(SAMPLE);
    const [item] = (sampleBlocks(t)[1] as ListBlock).items;
    if (item) item.ex = { pattern: ["take", { slot: { en: "noun", uk: "іменник" } }] };
    const before = fingerprint(t);
    if (item) item.ex = { pattern: ["take", { slot: { en: "noun", uk: "іменник", es: "sustantivo" } }] };
    expect(fingerprint(t)).toBe(before);
  });
});
