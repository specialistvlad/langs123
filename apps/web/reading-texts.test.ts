// Each block's text as the reading shows it, the contract another reader of the export holds its text to: every block of
// the four samples and each language's own blocks, its words whole, its labels and capsules out.
import { expect, test } from "bun:test";
import { exportLibrary } from "../../scripts/export.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { readingTexts, words } from "./reading-texts.ts";

const v1 = await exportLibrary({ library: "v1", root: SAMPLES_ROOT, drafts: true });

test("every block of every sample written in the language has its text, and so does each of the language's own blocks", () => {
  const texts = readingTexts(v1, "uk");
  const topics = v1.courses.flatMap((c) => c.topics);
  expect(Object.keys(texts).sort()).toEqual(topics.map((t) => t.id).sort());
  for (const topic of topics) {
    // A block without a text serves a variety other than the course's first.
    const blocks = [...topic.subtopics.flatMap((s) => s.blocks), ...(topic.own["uk"]?.blocks ?? [])];
    const missing = blocks.filter((b) => texts[topic.id]?.[b.id] === undefined);
    expect(missing.filter((b) => b.variety === undefined).map((b) => b.id)).toEqual([]);
    expect(Object.values(texts[topic.id] ?? {}).filter((text) => text === "")).toEqual([]);
  }
  expect(texts["en.alphabet"]?.["names-ei.list"]).toStartWith("A /eɪ/ apple яблуко H /eɪtʃ/ house будинок");
  // A list item's form reads with its marks resolved, in each language's view.
  for (const language of ["en", "uk", "ja"]) {
    expect(readingTexts(v1, language)["en.words-of-place"]?.["opposite.list"]).toStartWith("opposite The bank is opposite the hotel.");
  }
  // A variant mark reads in the course's first variety with the sentence's spacing intact: one space before it, and its
  // dropped variety takes its own space, so none stands before the following punctuation (here es-ES "vosotros" drops).
  expect(readingTexts(v1, "es")["es.subject-pronouns"]?.["personas.example"]).toContain("¿y ustedes?");
  expect(Object.keys(readingTexts(v1, "es"))).toEqual(["es.subject-pronouns"]);
  expect(Object.keys(readingTexts(v1, "fr"))).toEqual([]);
});

test("no text runs two items together or sets a space before its punctuation, on the page or in the texts", () => {
  for (const language of ["uk", "en", "ja"]) {
    for (const [topic, blocks] of Object.entries(readingTexts(v1, language))) {
      for (const [id, text] of Object.entries(blocks)) {
        expect(text, `${topic} ${id}`).not.toMatch(/ [?!.,;:]/);
        expect(text, `${topic} ${id}`).not.toMatch(/[.?!][A-ZА-ЯЁЇІЄҐ]/u);
      }
    }
  }
});

test("the words of a block keep each word whole, set a space where a line or a translation ends and leave out the labels", () => {
  expect(words('<div class="rd-why"><p class="lx-label">Чому</p><p><b class="lx-b">a</b>pple &amp; <i>pear</i></p></div>')).toBe(
    "apple & pear",
  );
  expect(words('<span class="lx-ex">I work.<span class="lx-tr">Я працюю.</span></span><br>&lt;x&gt; &quot;y&quot;')).toBe(
    'I work. Я працюю. <x> "y"',
  );
  expect(words('<div class="rd-tag-row"><span class="lx-capsule">GB</span><p class="lx-p">lorry</p></div>')).toBe("lorry");
});
