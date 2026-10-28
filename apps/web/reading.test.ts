// The reading of the four samples: the interleaved form in one language, the layers' forms in three, offered by the width
// rule; the errors of the reader's languages' speakers alone; a wide table split with Full screen on a phone and whole on a
// desktop; the picture's cells; a text the first language lacks read in the course's own; and the own blocks of a language.
import { expect, test } from "bun:test";
import type { Topic } from "../../scripts/generated/export-v1.ts";
import { exportLibrary } from "../../scripts/export.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { Reading } from "./reading.ts";
import { article, forms } from "./reading-layers.ts";
import { interleaved, parts } from "./reading-parts.ts";
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

test("one language reads interleaved with no switch: the head, the essence, the subtopics and the errors", () => {
  const html = interleaved(read("en.present-simple", ["uk"]));
  expect(html).toContain('<p class="lx-lead">');
  expect(html).toContain(`<span class="lx-num">00</span>${words("uk").say("essence")}`);
  expect(html).toContain(words("uk").say("commonErrors"));
  expect(html).toContain(words("uk").say("why"));
  expect(html).not.toContain('class="rd-lang" lang=');
  expect(article(read("en.present-simple", ["uk"]), "side")).not.toContain('class="rd-seg"');
});

test("the forms follow the width rule: side by side from 640 for two languages and from 1000 for three", () => {
  expect(forms(read("en.present-simple", ["uk"], 1440))).toEqual([]);
  expect(forms(read("en.present-simple", ["uk", "ja"], 362))).toEqual(["interleaved", "reveal"]);
  expect(forms(read("en.present-simple", ["uk", "ja"], 640))).toEqual(["interleaved", "reveal", "side"]);
  expect(forms(read("en.present-simple", ["uk", "ja", "en"], 816))).toEqual(["interleaved", "reveal"]);
  expect(forms(read("en.present-simple", ["uk", "ja", "en"], 1000))).toEqual(["interleaved", "reveal", "side"]);
  const roomy = new Reading(topic("en.present-simple"), "en", ["uk", "ja", "en"], words("uk"), 816, "en-GB", 1384);
  expect(forms(roomy)).toEqual(["interleaved", "reveal", "side"]);
  expect(article(read("en.present-simple", ["uk", "ja"], 362), "side")).toContain('data-form="interleaved"');
});

test("each form draws every language, reviewed or not, in the same form", () => {
  const r = (): Reading => read("en.present-simple", ["uk", "ja", "en"], 1100);
  const inter = article(r(), "interleaved");
  expect(inter).toContain('<span class="rd-lang" lang="ja"><span class="lx-capsule">JA</span>');
  expect(inter).toContain('aria-selected="true">' + words("uk").say("layersInterleaved"));
  const reveal = article(r(), "reveal");
  expect(reveal).toContain('<button type="button" class="rd-more" aria-expanded="false">');
  expect(reveal).toContain('<div class="rd-rv-open" hidden>');
  const side = article(r(), "side");
  expect(side).toContain('<div class="rd-lgrid rd-l3">');
  expect(side).toContain(`${words("uk").say("layersSideBySide")}</button>`);
  for (const l of ["uk", "ja", "en"]) expect(side).toContain(`<div class="rd-lc" lang="${l}">`);
  expect(side).toContain('<span class="rd-th2" lang="ja">');
  expect(side).toContain('<div class="rd-lc" lang="ja"><div class="rd-blk" lang="ja">');
  expect(article(read("es.subject-pronouns", ["uk", "en"], 700, "es-ES"), "side")).toContain('<div class="rd-lgrid rd-l2">');
  expect(article(read("en.alphabet", ["uk", "ja"], 362), "reveal")).toContain("rd-rv");
});

test("a reader sees the errors of their languages' speakers alone, with those speakers' reasons", () => {
  const uk = interleaved(read("en.words-of-place", ["uk"]));
  const es = interleaved(read("en.words-of-place", ["es"]));
  expect(uk.match(/<article class="rd-err"/g)).toHaveLength(1);
  expect(es.match(/<article class="rd-err"/g)).toHaveLength(4);
  expect(uk).toContain(words("uk").say("speakersOf", { language: words("uk").name("uk") }));
  expect(uk).not.toContain('data-speakers="es"');
  const both = interleaved(new Reading(topic("en.words-of-place"), "en", ["uk"], words("uk"), 362, "en-GB", 362, ["uk", "es"]));
  expect(both.match(/<article class="rd-err"/g)).toHaveLength(5);
  expect(both).toContain(`<li data-speakers="es">`);
  expect(interleaved(read("en.present-simple", ["en"]))).not.toContain('class="rd-err"');
});

test("a wide table splits on a phone with Full screen holding it whole, and stands whole on a desktop", () => {
  const phone = interleaved(read("en.present-simple", ["uk"], 362));
  expect(phone).toContain(`${words("uk").say("fullScreen")}</button>`);
  expect(phone).toContain('<dialog class="rd-full"');
  expect(interleaved(read("en.present-simple", ["uk"], 2000))).not.toContain("rd-full");
});

test("the picture draws a cell per line, captioned with its form and labelled with its example and translation", () => {
  const html = interleaved(read("en.words-of-place", ["uk"]));
  expect(html.match(/<figure class="rd-cell"/g)).toHaveLength(15);
  expect(html).toContain(">in front of</figcaption>");
  expect(html).toMatch(/aria-label="The ball is in the box\. · [^"]+"/);
  expect(interleaved(read("en.alphabet", ["uk"]))).not.toContain("rd-grid");
});

test("a text the first language lacks reads in the course's own, and its id is noted", () => {
  const r = read("en.present-simple", ["fr"]);
  const html = interleaved(r);
  expect(r.missing.length).toBeGreaterThan(0);
  expect(html).toContain('<p class="lx-lead">');
  expect(parts(r).map((p) => p.n)).toEqual([
    "00",
    ...topic("en.present-simple").subtopics.map((_, i) => String(i + 1).padStart(2, "0")),
    "",
  ]);
  expect(parts(read("en.present-simple", ["en"])).at(-1)?.n).toBe(String(topic("en.present-simple").subtopics.length).padStart(2, "0"));
});

test("a variety's blocks show for that variety, and every variety shows with its name", () => {
  const spain = interleaved(read("es.subject-pronouns", ["en"], 362, "es-ES"));
  const all = interleaved(read("es.subject-pronouns", ["en"], 362, "all"));
  expect(spain).toContain('<span class="lx-capsule">Spain</span>');
  expect(spain).not.toContain('<span class="lx-capsule">Latin America</span>');
  expect(all).toContain('<span class="lx-capsule">Latin America</span>');
});

test("a language's own blocks follow their block: a fact, a why and examples", () => {
  const base = topic("en.present-simple");
  const [sub] = base.subtopics;
  const after = sub?.blocks[0]?.id ?? "";
  const own = (type: "fact" | "why" | "example") => ({
    id: `own.${type}`,
    type,
    in: sub?.id ?? "",
    after,
    text: [{ id: "t", text: "Own text." }],
    items: [{ id: "i", text: "Own example.", tr: "Власний приклад." }],
  });
  const blocks = [own("fact"), own("why"), { ...own("example"), variety: "en-GB" }];
  const synthetic: Topic = { ...base, own: { uk: { blocks, errors: [], speakers: {} } } };
  const html = interleaved(new Reading(synthetic, "en", ["uk"], words("uk"), 362, "en-GB"));
  expect(html).toContain(
    '<div class="rd-blk" lang="uk"><span class="rd-lang"><span class="lx-capsule">UK</span></span><p>Own text.</p></div>',
  );
  expect(html).toContain(`<div class="rd-why" lang="uk"><p class="lx-label">${words("uk").say("why")}</p>`);
  expect(html).toContain('<span class="lx-tr" lang="uk">Власний приклад.</span>');
});

test("a language's own errors and its speakers' own reasons show to readers of that language", () => {
  const base = topic("en.words-of-place");
  const shared = base.errors.find((e) => "es" in e.speakers && !("uk" in e.speakers));
  const sub = base.subtopics[0]?.id ?? "";
  const ownError = {
    id: "own.e",
    in: sub,
    level: "A1" as const,
    wrong: "in the table",
    right: { id: "own.r", text: "{target on} the table", tr: "на столі" },
    rule: { id: "own.rule", text: "Своє правило." },
    speakers: { uk: { id: "own.s", text: "Своя причина." } },
  };
  const plainRight = { ...ownError, id: "own.f", in: "nowhere", right: "on the table", speakers: { ja: { id: "own.j", text: "ja" } } };
  const synthetic: Topic = {
    ...base,
    own: {
      uk: { blocks: [], errors: [ownError, plainRight], speakers: { [shared?.id ?? ""]: { id: "own.x", text: "Причина для своїх." } } },
    },
  };
  const html = interleaved(new Reading(synthetic, "en", ["uk"], words("uk"), 362, "en-GB"));
  expect(html).toContain('<p class="rd-err-rule" lang="uk">Своє правило.</p>');
  expect(html).toContain("Своя причина.");
  expect(html).toContain("Причина для своїх.");
  expect(html).toContain('<span class="rd-fix">on</span> the table<span class="lx-tr">на столі</span>');
  expect(html).toContain('<p class="rd-err-r">on the table</p>');
});

test("no form, item or line of the samples shows a raw mark, in any language, variety or form", () => {
  for (const t of v1.courses.flatMap((c) => c.topics)) {
    const source = t.id.startsWith("es.") ? "es" : "en";
    for (const language of Object.keys(t.title.text)) {
      for (const variety of ["en-GB", "en-US", "es-ES", "es-419", "all"]) {
        const r = new Reading(
          t,
          source,
          Object.keys(t.title.text).sort((a) => (a === language ? -1 : 1)),
          words(language),
          1100,
          variety,
        );
        for (const form of ["interleaved", "reveal", "side"] as const) {
          expect(article(r, form), `${t.id} ${language} ${variety} ${form}`).not.toMatch(/\{(variant|term|target|ipa|l1)\b/);
        }
      }
    }
  }
});

test("an essence line carries its level mark only where the topic spans levels, and a letter's example word reads under it", () => {
  const essenceOf = (html: string): string =>
    html.slice(html.indexOf('id="essence"'), html.indexOf("</section>", html.indexOf('id="essence"')));
  expect(essenceOf(interleaved(read("en.alphabet", ["uk"])))).not.toContain("lx-ladder");
  expect(essenceOf(interleaved(read("en.present-simple", ["uk"])))).toContain('class="lx-ladder lx-sm"');
  const base = topic("en.alphabet");
  const [first] = base.essence;
  if (first === undefined) throw new Error("no line");
  const withWord: Topic = {
    ...base,
    essence: [
      { ...first, ex: { id: "ess.a.ex", text: "{target a}pple", tr: { uk: "яблуко" } } },
      { ...first, id: "ess.b", ex: { id: "ess.b.ex", text: "bee", tr: {} } },
    ],
  };
  const html = essenceOf(interleaved(new Reading(withWord, "en", ["uk"], words("uk"), 362, "en-GB")));
  expect(html).toContain('<span class="lx-row-sub"><b class="lx-b">a</b>pple<span class="lx-j" aria-hidden="true"></span>яблуко</span>');
  expect(html).toContain('<span class="lx-row-sub">bee</span>');
});
