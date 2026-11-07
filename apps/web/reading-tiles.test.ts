// The reading's lists and essence lines of letters: a line's level mark only where the topic spans levels, a letter's line
// reading letter, sound and word with the word's translation under it, and a list of forms with one-word examples as tiles
// while a list with a sentence keeps its rows.
import { expect, test } from "bun:test";
import type { Topic } from "../../scripts/generated/export-v1.ts";
import { exportLibrary } from "../../scripts/export.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { Reading } from "./reading.ts";
import { interleaved } from "./reading-parts.ts";
import { Words } from "./reading-words.ts";

const v1 = await exportLibrary({ library: "v1", root: SAMPLES_ROOT, drafts: true });
const topic = (id: string): Topic => {
  const found = v1.courses.flatMap((c) => c.topics).find((t) => t.id === id);
  if (found === undefined) throw new Error(`no sample ${id}`);
  return found;
};
const words = (language: string): Words => Words.of(v1.library, language);
const read = (id: string, languages: string[]): Reading =>
  new Reading(topic(id), "en", languages, words(languages[0] ?? "en"), 362, "en-GB");

test("an essence line carries its level mark only where the topic spans levels, a letter's line reading letter, sound and word", () => {
  const essenceOf = (html: string): string =>
    html.slice(html.indexOf('id="essence"'), html.indexOf("</section>", html.indexOf('id="essence"')));
  const alphabet = essenceOf(interleaved(read("en.alphabet", ["uk"])));
  expect(alphabet).not.toContain("lx-pill");
  expect(alphabet.match(/class="lx-ladder/g)).toHaveLength(1);
  expect(alphabet).toContain(
    '<span class="lx-row-t">A a<span class="lx-j" aria-hidden="true"></span><span class="lx-ipa"><i class="lx-sl">/</i>eɪ<i class="lx-sl">/</i></span><span class="lx-j" aria-hidden="true"></span><b class="lx-b">a</b>pple<span class="lx-row-sub">яблуко</span></span>',
  );
  const present = essenceOf(interleaved(read("en.present-simple", ["uk"])));
  expect(present).toContain('<span class="lx-pill lx-pill-');
  expect(present).not.toContain("lx-ladder lx-sm");
  expect(present).toMatch(/<span class="lx-num">00<\/span>[^<]*<\/span><button type="button" class="lx-ladder"/);
  const base = topic("en.alphabet");
  const [first] = base.essence;
  if (first === undefined) throw new Error("no line");
  const bare = { id: first.id, form: first.form ?? "A", ipa: first.ipa ?? "eɪ", level: first.level ?? "A0" };
  expect(essenceOf(interleaved(new Reading({ ...base, essence: [bare] }, "en", ["uk"], words("uk"), 362, "en-GB")))).not.toContain(
    "lx-row-sub",
  );
});

test("a list of forms with one-word examples lays out as tiles, wider where they carry other languages' translations, and a list with a sentence keeps its rows", () => {
  const html = interleaved(read("en.alphabet", ["uk", "ja"]));
  expect(html.match(/<div class="rd-tiles rd-tl">/g)).toHaveLength(6);
  expect(html).toContain(
    '<div class="rd-tile"><b class="rd-term">A</b><span class="rd-tile-s"><span class="lx-ipa"><i class="lx-sl">/</i>eɪ<i class="lx-sl">/</i></span></span><span class="rd-tile-w"><b class="lx-b">a</b>pple</span><span class="lx-tr">яблуко</span><span class="lx-tr rd-trl" lang="ja">',
  );
  const alone = interleaved(read("en.alphabet", ["uk"]));
  expect(alone.match(/<div class="rd-tiles">/g)).toHaveLength(6);
  expect(alone).toContain('<span class="lx-tr">яблуко</span>');
  const own = interleaved(read("en.alphabet", ["en"]));
  expect(own.match(/<div class="rd-tiles">/g)).toHaveLength(6);
  expect(own).not.toContain('<span class="lx-tr">');
  const place = interleaved(read("en.words-of-place", ["uk"]));
  expect(place.slice(place.indexOf('id="opposite"'))).toContain('<ul class="lx-list">');
});
