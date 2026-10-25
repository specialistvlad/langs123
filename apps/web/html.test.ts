// Text as HTML: every mark is an element that names it, values and varieties ride along, and text is escaped.
import { describe, expect, test } from "bun:test";
import type { Mark, TopicRef } from "../../scripts/lib.ts";
import { MARKS } from "../../scripts/text.ts";
import { type Ctx, inline } from "./html.ts";

const target = { id: "en.verbs.to-be" } as TopicRef;
const ctx: Ctx = {
  ref: { id: "en.sample.topic", lang: "en" } as TopicRef,
  explain: "en",
  refs: [target],
  link: (to) => (to === target ? "/en/english/verbs/to-be/" : null),
};
const html = (m: Mark, plain = true): string => inline(m, ctx, plain);

describe("every mark is an element that names it", () => {
  const strong: Mark[] = [
    { target: "go" },
    { aux: "Does" },
    { subj: "she" },
    { verb: "work" },
    { ending: "s" },
    { stress: "ˈtea" },
    { term: "yet" },
    { letter: "b" },
    { signal: "now" },
  ];
  test.each(strong.map((m) => [Object.keys(m)[0], m] as const))("%s shows in bold", (name, m) => {
    expect(html(m)).toBe(`<strong data-mark="${name}">${Object.values(m)[0] as string}</strong>`);
  });
  test("a sound, a meaning in the reader's language and their own phrase show in italics", () => {
    expect(html({ sound: "use-ta" })).toBe('<em data-mark="sound">use-ta</em>');
    expect(html({ l1: "ya" })).toBe('<em data-mark="l1">ya</em>');
    expect(html({ gloss: { en: "= your job" } })).toBe('<em data-mark="gloss">(= your job)</em>');
  });
  test("a value rides with its text", () => {
    expect(html({ weekday: "Monday", value: 1 })).toBe('<span data-mark="weekday" data-value="1">Monday</span>');
    expect(html({ date: "July", value: "--07" })).toBe('<span data-mark="date" data-value="--07">July</span>');
    expect(html({ time: "7:05", value: "07:05" })).toBe('<span data-mark="time" data-value="07:05">7:05</span>');
    expect(html({ numeral: "seven", value: 7 })).toBe('<span data-mark="numeral" data-value="7">seven</span>');
    expect(html({ ordinal: "third", value: 3 })).toBe('<span data-mark="ordinal" data-value="3">third</span>');
  });
  test("a link leads to a written topic, and marks one without a page", () => {
    expect(html({ link: "To be", to: "en.verbs.to-be" }, false)).toBe('<a href="/en/english/verbs/to-be/" data-mark="link">To be</a>');
    expect(html({ link: "Later", to: "en.verbs.later" }, false)).toBe('<span class="missing" data-mark="link">Later</span>');
  });
  test("a variant names its variety", () => {
    expect(html({ variant: "on the weekend", variety: "en-US" })).toBe(
      '<span data-mark="variant" data-variety="en-US">(US: on the weekend)</span>',
    );
  });
  test("kanji carries its reading over it, inside the form it is part of", () => {
    expect(html({ kanji: "食", reading: "た" })).toBe('<span data-mark="kanji"><ruby>食<rt>た</rt></ruby></span>');
    expect(html({ target: [{ kanji: "食", reading: "た" }, "べます"] })).toBe(
      '<strong data-mark="target"><span data-mark="kanji"><ruby>食<rt>た</rt></ruby></span>べます</strong>',
    );
  });
  test("structures and the other marks keep their name", () => {
    expect(html({ ipa: "wɜːk" })).toBe('<span data-mark="ipa">/wɜːk/</span>');
    expect(html({ pattern: ["be", { slot: "V-ing" }] })).toBe('<span data-mark="pattern">be + <span data-mark="slot">V-ing</span></span>');
    expect(html({ exchange: ["A?", { alternatives: ["Yes.", "No."] }] })).toBe(
      '<span data-mark="exchange">A? — <span data-mark="alternatives">Yes. / No.</span></span>',
    );
  });
  test("text is escaped", () => {
    expect(inline(["<b> & ", { target: '"q"' }], ctx, true)).toBe('&lt;b&gt; &amp; <strong data-mark="target">&quot;q&quot;</strong>');
  });
  test("every mark name renders with its name", () => {
    const named = new Set(
      [
        ...inline(
          [
            ...[...MARKS].map((name): Mark => {
              const samples: Record<string, Mark> = {
                date: { date: "d", value: "2026" },
                weekday: { weekday: "w", value: 1 },
                time: { time: "t", value: "10:00" },
                numeral: { numeral: "n", value: 1 },
                ordinal: { ordinal: "o", value: 1 },
                link: { link: "l", to: "en.verbs.to-be" },
                ipa: { ipa: "i" },
                intonation: { intonation: "rise" },
                gap: { gap: true },
                kanji: { kanji: "k", reading: "r" },
                variant: { variant: "v", variety: "en-US" },
                gloss: { gloss: { en: "g" } },
                slot: { slot: "V" },
                alternatives: { alternatives: ["a", "b"] },
                examples: { examples: ["a", "b"] },
                mapping: { mapping: ["a", "b"] },
                takes: { takes: ["a", "b"] },
                exchange: { exchange: ["a", "b"] },
                pattern: { pattern: ["a", "b"] },
                equivalence: { equivalence: ["a", "b"] },
                contrast: { contrast: ["a", "b"] },
              };
              return samples[name] ?? ({ [name]: name } as unknown as Mark);
            }),
          ],
          ctx,
          true,
        ).matchAll(/data-mark="([a-z0-9]+)"/g),
      ].map((m) => m[1]),
    );
    expect([...MARKS].filter((n) => !named.has(n))).toEqual([]);
  });
});

describe("on a page in another language, every piece names its language", () => {
  const uk: Ctx = { ...ctx, explain: "uk" };
  test("text in the language being learned is English; on an English page nothing names it", () => {
    expect(inline(["She ", { target: "works" }, "."], uk, true)).toBe(
      '<span lang="en">She <strong data-mark="target">works</strong>.</span>',
    );
    expect(inline(["She ", { target: "works" }, "."], ctx, true)).toBe('She <strong data-mark="target">works</strong>.');
  });
  test("a form inside an explanation is English, and a variant takes the language around it", () => {
    expect(inline(["Після ", { term: "Did" }, " — ", { ipa: "dɪd" }], uk, false)).toBe(
      'Після <strong data-mark="term" lang="en">Did</strong> — <span data-mark="ipa">/dɪd/</span>',
    );
    expect(inline([{ variant: "on the weekend", variety: "en-US" }], uk, false)).toBe(
      '<span data-mark="variant" data-variety="en-US">США: on the weekend</span>',
    );
  });
  test("a gloss and a named slot inside an example are in the reader's language; V reads as written", () => {
    expect(inline(["I'd go. ", { gloss: { uk: "= я б пішов", en: "= I would go" } }], uk, true)).toBe(
      '<span lang="en">I&#39;d go. <em data-mark="gloss" lang="uk">(= я б пішов)</em></span>',
    );
    expect(inline({ pattern: [{ slot: "subject" }, "can", { slot: "V" }] }, uk, true)).toBe(
      '<span lang="en"><span data-mark="pattern"><span data-mark="slot" lang="uk">підмет</span> + can + <span data-mark="slot">V</span></span></span>',
    );
    expect(inline({ slot: { uk: "година", en: "clock time" } }, uk, true)).toBe(
      '<span lang="en"><span data-mark="slot" lang="uk">година</span></span>',
    );
  });
});
