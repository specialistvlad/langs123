// The marks of the new library's text: a target, a term, a transcription between slashes, a phrase in its language's quotation
// marks, a variant shown alone with its tap or with every variety named, the right form of an error, and the plain text of each.
import { expect, test } from "bun:test";
import { marks, parseMarks, plain } from "./reading-marks.ts";
import { columnWidth, splitColumns } from "./reading-table.ts";
import { Words } from "./reading-words.ts";

test("each mark draws its element, a target corrected in an error", () => {
  expect(marks("Say {target in} the {term box}.", { variety: "en-GB" })).toBe('Say <b class="lx-b">in</b> the <b class="rd-term">box</b>.');
  expect(marks("{target in}", { variety: "en-GB", fix: true })).toBe('<span class="rd-fix">in</span>');
  expect(marks("{ipa eɪ}", { variety: "en-GB" })).toBe('<span class="lx-ipa"><i class="lx-sl">/</i>eɪ<i class="lx-sl">/</i></span>');
  expect(marks("{l1 uk у коробці} and {l1 fr dans} and {l1 xx q}", { variety: "en-GB" })).toBe(
    '<span class="rd-l1" lang="uk">«у коробці»</span> and <span class="rd-l1" lang="fr">« dans »</span> and <span class="rd-l1" lang="xx">“q”</span>',
  );
  expect(marks("{other <b>}", { variety: "en-GB" })).toBe("&lt;b&gt;");
});

test("a variant shows the chosen variety with its tap, or still, or every variety with its name", () => {
  const src = "the {variant en-GB lorry} {variant en-US truck}";
  expect(marks(src, { variety: "en-GB" })).toBe(
    'the <button type="button" class="rd-var" data-variety="en-GB" aria-label="lorry, GB">lorry</button>',
  );
  expect(marks(src, { variety: "en-US", still: true })).toBe("the truck");
  expect(marks(src, { variety: "all" })).toBe(
    'the <span class="rd-vr"><span class="lx-capsule">GB</span>lorry</span> <span class="rd-vr"><span class="lx-capsule">US</span>truck</span>',
  );
  expect(marks("{ipa {variant en-GB ɑː}{variant xx-YY æ}}", { variety: "all" })).toContain(
    '<span class="lx-capsule">xx-YY</span><span class="lx-ipa">',
  );
  expect(marks("{ipa {variant en-GB ɑː}}", { variety: "en-GB", still: true })).toBe(
    '<span class="lx-ipa"><i class="lx-sl">/</i>ɑː<i class="lx-sl">/</i></span>',
  );
});

test("a dropped variety's form takes its space with it before punctuation, and leaves one space between words", () => {
  const src = "¿y {target {variant es-419 ustedes} {variant es-ES vosotros}}?";
  expect(marks(src, { variety: "es-419", still: true })).toBe('¿y <b class="lx-b">ustedes</b>?');
  expect(marks(src, { variety: "es-ES", still: true })).toBe('¿y <b class="lx-b">vosotros</b>?');
  expect(plain(parseMarks(src), { variety: "es-419" })).toBe("¿y ustedes?");
  expect(marks("the {variant en-GB lorry} {variant en-US truck} {variant xx a} stops", { variety: "en-US", still: true })).toBe(
    "the truck stops",
  );
  expect(marks("a{variant en-GB b}{variant en-US c}d", { variety: "en-US", still: true })).toBe("acd");
  const term = "{term {variant en-GB Opposite} {variant en-US Across from}}は、";
  expect(marks(term, { variety: "en-GB", still: true })).toBe('<b class="rd-term">Opposite</b>は、');
  expect(marks(term, { variety: "en-US", still: true })).toBe('<b class="rd-term">Across from</b>は、');
  expect(plain(parseMarks(term), { variety: "en-GB" })).toBe("Oppositeは、");
  const sound = "She works {ipa {variant en-GB wɜːks} {variant en-US wɜːrks}} in a shop.";
  expect(plain(parseMarks(sound), { variety: "en-GB" })).toBe("She works wɜːks in a shop.");
  expect(marks(sound, { variety: "en-US", still: true })).toBe(
    'She works <span class="lx-ipa"><i class="lx-sl">/</i>wɜːrks<i class="lx-sl">/</i></span> in a shop.',
  );
  expect(marks(sound, { variety: "en-GB", still: true })).toBe(
    'She works <span class="lx-ipa"><i class="lx-sl">/</i>wɜːks<i class="lx-sl">/</i></span> in a shop.',
  );
});

test("plain text keeps the words, the chosen variety's or every variety's side by side", () => {
  const nodes = parseMarks("{target {variant en-GB opposite}{variant en-US across from}} it");
  expect(plain(nodes, { variety: "en-US" })).toBe("across from it");
  expect(plain(nodes, { variety: "all" })).toBe("opposite / across from it");
});

test("the wording falls back to English and to its key, and fills its placeholders", () => {
  const words = new Words(
    { a: { en: "{language} speakers", uk: "Мова: {language:lower}" }, b: { en: "B" } },
    { uk: { en: "Ukrainian", uk: "Українська" } },
    "uk",
  );
  expect(words.say("a", { language: "Українська" })).toBe("Мова: українська");
  expect(words.say("b")).toBe("B");
  expect(words.say("c")).toBe("c");
  expect(words.in("en").say("a")).toBe("{language} speakers");
  expect([words.name("uk"), words.in("pt").name("uk"), words.name("xx")]).toEqual(["Українська", "Ukrainian", "xx"]);
});

test("a table's columns stand whole when they fit, and otherwise split into groups that each open with the first", () => {
  expect(columnWidth(10, [4, 8], true)).toBe(Math.ceil(8 * 7.4 + 30));
  const width = (c: string): number => (c === "a" ? 100 : 120);
  expect(splitColumns(["a", "b", "c"], width, 400)).toEqual([["a", "b", "c"]]);
  expect(splitColumns(["a", "b", "c", "d", "e"], width, 400)).toEqual([
    ["a", "b", "c"],
    ["a", "d", "e"],
  ]);
  expect(splitColumns(["a", "b", "c"], width, 150)).toEqual([
    ["a", "b"],
    ["a", "c"],
  ]);
  expect(splitColumns([], width, 400)).toEqual([]);
});
