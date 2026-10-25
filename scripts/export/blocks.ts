// Blocks and topics as library.json holds them (export.ts).
import { readingMinutes } from "../../apps/web/reading-time.ts";
import { serves } from "../content.ts";
import {
  type Block,
  type Cell,
  type Column,
  type Explain,
  type FeatureBundle,
  type Item,
  type Localized,
  say,
  type Text,
  type Topic,
  type Variety,
} from "../lib.ts";
import { plainText, varietyName } from "../text.ts";
import {
  audience,
  cellText,
  context,
  explained,
  inLanguage,
  learned,
  localized,
  perReading,
  readersOf,
  TRACK,
  translation,
} from "./text.ts";
import type { Keyed, LibraryBlock, LibraryCell, LibraryColumn, LibraryItem, LibraryTopic } from "./types.ts";

// A paragraph or a list item: explanation, example and translation; a note about a variety names it first,
// and on a language with varieties shows only while that variety is chosen. `text` keeps that name in front
// of the explanation; `label` is the name alone and `body` the explanation without it. `kind` is the list
// item's type: a rule, a note or an example.
interface ItemLike {
  level: Item["level"];
  readers?: Item["readers"] | undefined;
  text?: Localized | undefined;
  ex?: Text | undefined;
  tr?: Localized | undefined;
  variety?: Item["variety"] | undefined;
  type?: string;
}
function item(it: ItemLike): LibraryItem {
  const variety = it.variety;
  const text =
    variety === undefined ? localized(it.text) : localized(it.text ?? {}, (t, e, v) => `${varietyName(variety, e)}: ${explained(t, e, v)}`);
  const named = variety !== undefined && it.text === undefined ? perReading((e) => `${varietyName(variety, e)}:`) : text;
  const kind = it.type === "rule" || it.type === "note" || it.type === "example" ? it.type : undefined;
  return {
    text: named,
    body: variety === undefined ? undefined : localized(it.text),
    label: variety === undefined ? undefined : perReading((e) => varietyName(variety, e)),
    ex: inLanguage(it.ex),
    tr: translation(it.tr),
    level: it.level,
    variety,
    kind,
    for: readersOf(it),
  };
}

const isExample = (value: Cell): value is { ex: Text; tr: Localized } =>
  typeof value === "object" && !Array.isArray(value) && "ex" in value && "tr" in value;

const cell = (value: Cell | undefined): LibraryCell => {
  if (value === undefined) return {};
  if (isExample(value)) return { ex: inLanguage(value.ex), tr: translation(value.tr) };
  return { text: cellText(value) };
};

const SLOT_TITLE = { aux: "slotAux", subj: "slotSubj", verb: "slotVerb", rest: "slotRest" } as const;
const every = (key: string): Keyed => Object.fromEntries(TRACK.explain.map((e) => [e, say(key, e)]));

// A column: a slot paradigm's columns take their titles from interface.yaml, group by the sentence their
// features name, merge down where neighbours read the same but for the subject, and centre; any other
// column shows its label.
function column(c: Column, slots: boolean): LibraryColumn {
  const label = (): string | Keyed => cellText((c.label ?? "") as Text | Localized) ?? {};
  if (!slots) return { key: c.key, label: label(), for: readersOf(c) };
  const f = c.features as FeatureBundle | undefined;
  const sentence =
    c.slot === undefined || f === undefined
      ? undefined
      : f.interrogativity === "int"
        ? "groupQuestion"
        : f.polarity === "neg"
          ? "groupNegative"
          : "groupStatement";
  return {
    key: c.key,
    slot: c.slot,
    label: c.slot === undefined ? label() : every(SLOT_TITLE[c.slot]),
    group: sentence === undefined ? undefined : every(sentence),
    merge: c.slot !== "subj",
    center: true,
    for: readersOf(c),
  };
}

const block = (b: Block): LibraryBlock => {
  switch (b.type) {
    case "prose":
      return { type: "prose", item: item(b) };
    case "list":
      return { type: "list", items: b.items.map(item), for: readersOf(b) };
    case "paradigm":
    case "usage":
    case "comparison":
    case "inventory": {
      const slots = b.columns.some((c) => c.slot !== undefined);
      return {
        type: b.type,
        columns: b.columns.map((c) => column(c, slots)),
        rows: b.rows.map((r) => ({
          level: r.level,
          tr: translation(r.tr),
          variety: r.variety,
          for: readersOf(r),
          cells: b.columns.map((c) => cell(r[c.key] as Cell | undefined)),
        })),
        for: readersOf(b),
      };
    }
    case "errors":
      return {
        type: "errors",
        rows: b.rows.map((r) => ({
          level: r.level,
          wrong: inLanguage(r.wrong),
          right: inLanguage(r.right),
          rule: localized(r.rule),
          for: audience((e) => serves(r, e)),
        })),
        for: readersOf(b),
      };
  }
};

// ---------- Topics ----------

// The summary as the topic page reads it: the lead, the rule and the rule's examples in one paragraph.
function summaryText(s: Topic["summary"]): Keyed {
  return perReading((e, v) => {
    const lead = s.lead[e];
    if (lead === undefined) return undefined;
    const rule = s.rule[e];
    const parts = [explained(lead, e, v), rule === undefined ? "" : explained(rule, e, v)].filter((p) => p !== "");
    const ex = s.ex === undefined ? "" : ` ${learned(s.ex, e, v, true)}`;
    return parts.join(" ") + ex;
  });
}

const plainTitle = (value: Localized): Keyed | undefined => localized(value, (t, e, v) => plainText(t, context(e, v, false)));

// The minutes the full lesson takes to read, per explanation language (the website's reading time).
const minutesOf = (t: Topic, explains: readonly Explain[], v: Variety | undefined): Record<string, number> =>
  Object.fromEntries(explains.map((e) => [e, readingMinutes(t, e, v)]));

export const topic = (t: Topic, path: string): LibraryTopic => ({
  id: t.id,
  lang: t.lang,
  kind: t.kind,
  path,
  minutes: minutesOf(t, TRACK.explain, TRACK.varieties?.[0]),
  title: plainTitle(t.title),
  summary: summaryText(t.summary),
  // The lead alone: cards and Up next show it.
  lead: localized(t.summary.lead),
  cheatsheet: t.cheatsheet.content.map(block),
  sections: t.sections.map((s) => ({ title: plainTitle(s.title), for: readersOf(s), blocks: s.content.map(block) })),
});
