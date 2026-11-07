// The reading of the four samples in its forms and for a reader of several languages: the room rule that offers side by side;
// the head, part 00, the essence rows and the tables carrying every reader language; a tagged reader's error card; side by
// side's letter lines, tiles and own blocks; main + reveal's controls; and a variety's name in the reader's language.
import { expect, test } from "bun:test";
import type { Topic } from "../../scripts/generated/export-v1.ts";
import { exportLibrary } from "../../scripts/export.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { Reading } from "./reading.ts";
import { article, forms } from "./reading-layers.ts";
import { interleaved } from "./reading-parts.ts";
import { Words } from "./reading-words.ts";

const v1 = await exportLibrary({ library: "v1", root: SAMPLES_ROOT, drafts: true });
const topic = (id: string): Topic => {
  const found = v1.courses.flatMap((c) => c.topics).find((t) => t.id === id);
  if (found === undefined) throw new Error(`no sample ${id}`);
  return found;
};
const words = (language: string): Words => Words.of(v1.library, language);
const read = (id: string, languages: string[], column = 362, variety = "en-GB"): Reading =>
  new Reading(topic(id), id.startsWith("es.") ? "es" : "en", languages, words(languages[0] ?? "en"), column, variety);

test("the forms follow the room rule: side by side where the room holds every language, 640 for two and 1000 for three", () => {
  expect(forms(read("en.present-simple", ["uk"], 1440))).toEqual([]);
  expect(forms(read("en.present-simple", ["uk", "ja"], 362))).toEqual(["interleaved", "reveal"]);
  expect(forms(read("en.present-simple", ["uk", "ja"], 640))).toEqual(["interleaved", "reveal", "side"]);
  expect(forms(read("en.present-simple", ["uk", "ja", "en"], 816))).toEqual(["interleaved", "reveal"]);
  expect(forms(read("en.present-simple", ["uk", "ja", "en"], 1000))).toEqual(["interleaved", "reveal", "side"]);
  const roomy = new Reading(topic("en.present-simple"), "en", ["uk", "ja", "en"], words("uk"), 816, "en-GB", 1384);
  expect(forms(roomy)).toEqual(["interleaved", "reveal", "side"]);
  // The tablet: a 556 column inside the panes, 976 of room once they give way, holds two languages side by side.
  const tablet = new Reading(topic("en.present-simple"), "en", ["uk", "ja"], words("uk"), 556, "en-GB", 976);
  expect(forms(tablet)).toEqual(["interleaved", "reveal", "side"]);
  expect(forms(read("en.present-simple", ["uk", "ja"], 556))).toEqual(["interleaved", "reveal"]);
  expect(article(read("en.present-simple", ["uk", "ja"], 362), "side")).toContain('data-form="interleaved"');
});

test("the head's definition, part 00's head, the essence rows and the tables carry every reader language and the levels", () => {
  const two = interleaved(read("es.subject-pronouns", ["uk", "en"], 362, "es-419"));
  expect(two).toContain('<div class="rd-blk"><p class="lx-lead">');
  expect(two).toContain('<span class="lx-row-sub rd-trl" lang="en"><span class="lx-capsule">EN</span>');
  expect(two).toContain('<span class="rd-th2" lang="en">');
  const one = interleaved(read("es.subject-pronouns", ["uk"], 362, "es-419"));
  expect(one).not.toContain('<div class="rd-blk"><p class="lx-lead">');
  expect(one).not.toContain("rd-trl");
  expect(one).not.toContain("rd-th2");
  expect(interleaved(read("en.alphabet", ["uk"]))).not.toContain("lx-pill");
  const essence = article(read("en.present-simple", ["uk", "ja"], 1100), "side");
  expect(essence).toMatch(/<div class="rd-lspan rd-part" id="essence"><h2 class="lx-h2">[\s\S]*?<button type="button" class="lx-ladder"/);
});

test("a tagged reader's error card stands in two columns, its right form and rule in every language and each reason once in its speakers' language", () => {
  const place = topic("en.words-of-place");
  const both = interleaved(new Reading(place, "en", ["en", "uk"], words("en"), 362, "en-GB"));
  expect(both).toContain('<article class="rd-err rd-err-2"');
  expect(both).toContain('<div class="rd-err-c"><span class="rd-err-i rd-err-w">');
  expect(both).toContain('<p class="rd-err-rule rd-lang" lang="uk"><span class="lx-capsule">UK</span>');
  expect(both).toMatch(/<li data-speakers="uk"><span class="lx-capsule">[^<]*<\/span><span lang="uk">/);
  expect(both.match(/<li data-speakers="uk">/g)).toHaveLength(1);
  const alone = interleaved(new Reading(place, "en", ["en"], words("en"), 362, "en-GB", 362, ["en", "uk"]));
  expect(alone).toContain('<article class="rd-err rd-err-3"');
  expect(alone).toMatch(/<li data-speakers="uk"><span class="lx-capsule">[^<]*<\/span><span lang="en">/);
  const error = place.errors.find((e) => "uk" in e.speakers);
  if (error === undefined) throw new Error("no error of Ukrainian speakers");
  const translated = { ...error, right: { id: "right", text: "{target on} the table", tr: { en: "on the table", uk: "на столі" } } };
  const synthetic: Topic = { ...place, errors: [translated] };
  const html = interleaved(new Reading(synthetic, "en", ["en", "uk"], words("en"), 362, "en-GB"));
  expect(html).toContain(
    '<span class="lx-tr">on the table</span><span class="lx-tr rd-trl" lang="uk"><span class="lx-capsule">UK</span><span>на столі</span></span>',
  );
});

test("side by side draws a letter line with its sound and word, a tiled list as tagged tiles across the row, and an own block in its column", () => {
  const side = article(read("en.alphabet", ["uk", "ja"], 1100), "side");
  expect(side).toContain('<span class="lx-ex rd-lsent">A a<span class="lx-j" aria-hidden="true"></span>');
  expect(side).toContain('<div class="rd-lspan"><div class="rd-tiles rd-tl"><div class="rd-tile"><b class="rd-term">A</b>');
  expect(side).toContain('<span class="lx-tr" lang="uk"><span class="lx-capsule">UK</span>яблуко</span>');
  expect(side).not.toContain('class="rd-lc" lang="uk"><div class="lx-li"><div class="lx-c"></div>');
});

test("main + reveal opens the other languages under each fact, each example and each list item", () => {
  const reveal = article(read("en.present-simple", ["uk", "ja"], 362), "reveal");
  expect(reveal).toContain('<div class="rd-exs"><div class="rd-rv"><span class="lx-ex">');
  expect(reveal).toContain('<li class="lx-li"><div class="lx-c"><div class="rd-rv"><span>');
  expect(reveal).toContain('<div class="rd-rv"><p class="lx-p">');
  expect(reveal.match(/<button type="button" class="rd-more"/g)?.length ?? 0).toBeGreaterThan(topic("en.present-simple").subtopics.length);
  // A second language with no text of the topic opens nothing: each block stands in the first language alone.
  expect(article(read("en.present-simple", ["uk", "fr"], 362), "reveal")).not.toContain("rd-more");
});

test("a variety wears its name in the reader's language", () => {
  const uk = interleaved(read("es.subject-pronouns", ["uk"], 362, "all"));
  expect(uk).toContain('<span class="lx-capsule">Латинська Америка</span>');
  expect(uk).toContain('<span class="lx-capsule">Іспанія</span>');
  expect(interleaved(read("en.alphabet", ["en"], 362, "all"))).toContain('<span class="lx-capsule">UK</span>');
});

test("the level marks open the page's popover: the head names the topic, part 00 its lines, each part itself", () => {
  const html = interleaved(read("en.present-simple", ["uk"]));
  expect(html).toContain('class="lx-ladder" data-lv="topic" data-lv-levels="A1 A2" popovertarget="lv-pop"');
  expect(html).toContain('data-lv="essence" data-lv-levels="A1 A2" popovertarget="lv-pop"');
  const [first] = topic("en.present-simple").subtopics;
  expect(html).toContain(`data-lv="${first?.id ?? ""}" data-lv-levels="${first?.level ?? ""}" popovertarget="lv-pop"`);
  expect(html).toContain('class="lx-ladder lx-sm" data-lv="');
});
