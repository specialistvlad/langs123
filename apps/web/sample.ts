// The sample: the few topics the tests build into a site instead of the whole library, chosen so that
// together they use every feature the library uses (sample.test.ts holds them to it), and the explanation
// languages their tracks are read in. A feature is anything a page renders its own way: the language
// learned, a topic kind, a section role, a block type, an inventory set, an item type, a mark, a slot or
// features column, an example or localized cell, a translation, a variety, readers or speakers, and every
// level.
import { EXPLAIN_CODES, type Block, type Explain, type Topic } from "../../scripts/lib.ts";
import { topicTexts } from "../../scripts/content.ts";
import { leaves } from "../../scripts/levels.ts";
import { markName } from "../../scripts/text.ts";
import { walkText } from "../../scripts/text-walk.ts";

export interface Sample {
  // Topic ids; a planned topic shows as a row of its track's index.
  topics: string[];
  // The explanation languages the sample's tracks are built in; home, credits and the missing page are
  // built in every explanation language.
  explain: Explain[];
}

export const SAMPLE: Sample = {
  topics: [
    // Each topic with the features it alone brings; the rest, most of the library's, they share.
    "en.tenses.simple-tenses", // the slot paradigm's aux column, the aux mark
    "en.foundations.days-months-dates", // inventories of days, months, dates and years
    "en.foundations.numbers", // inventories of numbers and ordinals, the numeral mark
    "en.foundations.telling-time", // an inventory of times, a paragraph with an example and translation
    "en.tenses.tense-map", // a reference topic, example items, an item without text, signals
    "en.modals.would", // a pronunciation section, the gloss mark
    "en.foundations.punctuation", // the subj and verb marks
    "en.foundations.connected-speech-intonation", // the intonation mark
    "en.verbs.to-be", // the slot paradigm's rest column
    "es.fundamentos.pronunciacion-acentuacion", // the es-ES variety, readers
    "es.sustantivo-determinantes.plural", // a spelling section, the l1 mark
    "uk.foundations.alphabet-handwriting", // Ukrainian, an inventory of letters
    "fr.bases.heure", // French, its varieties fr-FR and fr-CA
    "ja.sentence-basics.desu", // Japanese, a language learned and never explained in, the kanji mark
    // The pages the browser tests open, with their neighbours on the study path and by category: the first
    // topic of each order, the steps they follow, and the Spanish tables whose varieties they switch.
    "en.foundations.alphabet-spelling",
    "en.foundations.pronunciation-ipa",
    "en.sentence-building.word-order",
    "en.verbs.irregular-verbs-table",
    "es.fundamentos.alfabeto-ortografia",
    "es.presente.presente-regular",
    "es.pronombres.tu-usted-vosotros-ustedes",
    "es.ser-estar-hay-gustar.ser-estar",
  ],
  explain: ["en", "uk", "es"],
};

function blockFeatures(b: Block, add: (f: string) => void): void {
  add(`block:${b.type}`);
  if (b.readers) add("readers");
  for (const leaf of leaves(b)) add(`level:${leaf.level}`);
  switch (b.type) {
    case "prose":
      if (b.ex !== undefined) add("prose:ex");
      if (b.tr !== undefined) add("prose:tr");
      return;
    case "list":
      for (const it of b.items) {
        add(`item:${it.type}`);
        if (it.readers) add("readers");
        if (it.variety !== undefined) add(`variety:${it.variety}`);
        if (it.text === undefined) add("item:no-text");
        if (it.ex !== undefined) add("item:ex");
        if (it.tr !== undefined) add("item:tr");
      }
      return;
    case "errors":
      for (const r of b.rows) {
        if (r.readers) add("readers");
        if (r.speakers) add("errors:speakers");
        if (r.rule === undefined) add("errors:no-rule");
      }
      return;
    case "paradigm":
    case "usage":
    case "comparison":
    case "inventory":
      if (b.type === "inventory") add(`inventory:${b.set}`);
      for (const c of b.columns) {
        if (c.slot !== undefined) add(`column:slot-${c.slot}`);
        if (c.features !== undefined) add("column:features");
        if (c.readers) add("readers");
        if (c.label === undefined) add("column:no-label");
      }
      for (const r of b.rows) {
        if (r.readers) add("readers");
        if (r.variety !== undefined) add(`variety:${r.variety}`);
        if (r.features !== undefined) add("row:features");
        if (r.value !== undefined) add("row:value");
        if (r.tr !== undefined) add("row:tr");
        for (const c of b.columns) {
          const cell = r[c.key];
          if (cell === undefined) add("cell:empty");
          else if (typeof cell === "object" && !Array.isArray(cell) && "ex" in cell && "tr" in cell) add("cell:example");
          else if (typeof cell === "object" && !Array.isArray(cell) && !("ex" in cell) && Object.keys(cell).every((k) => k.length === 2)) {
            add("cell:localized");
          }
        }
      }
  }
}

// What a topic uses, as feature names.
export function features(topic: Topic): Set<string> {
  const found = new Set<string>();
  const add = (f: string): void => {
    found.add(f);
  };
  add(`lang:${topic.lang}`);
  add(`kind:${topic.kind}`);
  if (topic.summary.ex !== undefined) add("summary:ex");
  for (const b of topic.cheatsheet.content) blockFeatures(b, add);
  for (const s of topic.sections) {
    add(`role:${s.role}`);
    if (s.readers) add("readers");
    if (s.features !== undefined) add("section:features");
    for (const b of s.content) blockFeatures(b, add);
  }
  for (const t of topicTexts(topic, EXPLAIN_CODES)) {
    walkText(
      t.text,
      {
        mark: (m) => {
          add(`mark:${markName(m)}`);
        },
      },
      t.plain,
      t.langs,
    );
  }
  return found;
}
