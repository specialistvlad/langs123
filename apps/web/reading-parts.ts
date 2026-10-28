// The parts of a topic around its subtopics (R1, R4, R6, R7): the head with the levels, the reading time and the definition;
// part 00, the essence's linked lines with the picture of a topic that has one; and the common errors of the reader's
// languages' speakers, each with its wrong form, its right form, its rule and why those speakers make it.
import type { Translated } from "../../scripts/generated/export-v1.ts";
import { type Ground, sceneGrid } from "./pictures.ts";
import type { Reading } from "./reading.ts";
import { subtopic } from "./reading-blocks.ts";
import { esc, marks, parseMarks, plain, tag, varietyLabel } from "./reading-marks.ts";
import { formText, ladder, partHead, SVG_CHEV, SVG_CLOCK, SVG_TICK, SVG_X } from "./reading-words.ts";

const num = (n: number): string => String(n).padStart(2, "0");

// R1: the head under the title, with the topic's levels and its reading time in the first language, and its definition in
// the first language alone (side by side sets each language's in its column).
export function head(r: Reading, lead = true): string {
  const minutes = String(r.topic.minutes[r.main] ?? r.topic.minutes[r.source] ?? 1);
  const definition = lead ? `<p class="lx-lead">${r.m(r.say(r.topic.definition.id, r.topic.definition.text))}</p>` : "";
  return (
    `<header class="rd-head"><p class="lx-meta">${ladder(r.topic.levels, r.words)}<span class="lx-dot" aria-hidden="true"></span>` +
    `<span class="lx-meta-i">${SVG_CLOCK} ${esc(r.words.say("minutes", { n: minutes }))}</span></p>` +
    `${definition}</header>`
  );
}

// R7: the picture's cells, each captioned with its line's form and labelled with its example and the translation.
function picture(r: Reading): string {
  const data = r.topic.picture;
  if (data === undefined) return "";
  const lines = new Map(r.topic.essence.map((e) => [e.id, e]));
  const cells = data.cells.flatMap((c) => {
    const e = lines.get(c.line);
    if (e === undefined || !r.shows(e.variety)) return [];
    const said = e.ex === undefined ? [] : [plain(parseMarks(e.ex.text), r.ctx), r.say(e.ex.id, e.ex.tr)];
    const ground = c.ground ?? data.ground;
    return [
      {
        place: c.place,
        caption: plain(parseMarks(formText(e.form)), r.ctx),
        label: said.filter((s) => s !== "").join(" · "),
        line: e.id,
        ground: ground as Ground | Ground[],
      },
    ];
  });
  return `<div class="rd-pic">${sceneGrid(cells)}</div>`;
}

// R4 and R7: part 00, the essence's lines in the first language, each linked to the subtopic that teaches it, in two cards
// on a wide column.
export function essence(r: Reading): string {
  const still = (text: string): string => marks(text, { ...r.ctx, still: true });
  const rows = r.topic.essence
    .filter((e) => r.shows(e.variety))
    .map((e) => {
      let form: string;
      let gloss: Translated | undefined;
      if (e.ipa !== undefined) form = `${esc(formText(e.form))}<span class="lx-j" aria-hidden="true"></span>${still(`{ipa ${e.ipa}}`)}`;
      else if (e.ex !== undefined) {
        form = still(e.ex.text);
        gloss = e.ex.tr;
      } else {
        form = `${e.variety === undefined ? "" : `${tag(varietyLabel(e.variety))} `}<b class="lx-b">${still(formText(e.form))}</b>`;
        gloss = e.text;
      }
      const first = gloss === undefined ? "" : r.say(e.ex?.id ?? e.id, gloss);
      const subs = [first === "" ? "" : `<span class="lx-row-sub">${still(first)}</span>`];
      const to = e.to === undefined ? "" : ` href="#${e.to}"`;
      return `<div class="lx-row"><a${to} class="lx-row-a lx-cover"><span class="lx-row-t">${form}${subs.join("")}</span></a>${ladder([e.level ?? "A1"], r.words, true)}<span class="lx-chev">${SVG_CHEV}</span></div>`;
    });
  const half = Math.ceil(rows.length / 2);
  const cards = [rows.slice(0, half), rows.slice(half)].filter((c) => c.length > 0).map((c) => `<div class="lx-card">${c.join("")}</div>`);
  return `<section class="rd-part" id="essence">${partHead("00", esc(r.words.say("essence")))}${picture(r)}<div class="rd-two">${cards.join("")}</div></section>`;
}

// An error's card: the wrong form, the right form with its translation, the rule, the reasons, and the subtopic it belongs to.
interface Card {
  id: string;
  in: string;
  speakers: string[];
  wrong: string;
  right: string;
  tr: string;
  rule: string;
  reasons: string[];
}
function card(r: Reading, c: Card): string {
  const sub = r.topic.subtopics.find((s) => s.id === c.in);
  const wrong = `<div class="rd-err-c"><span class="rd-err-i rd-err-w">${SVG_X}</span><p class="rd-err-w"><span class="rd-wrong">${r.m(c.wrong)}</span></p></div>`;
  const good = `<div class="rd-err-c"><span class="rd-err-i rd-err-r">${SVG_TICK}</span><p class="rd-err-r">${marks(c.right, { ...r.ctx, fix: true })}${c.tr === "" ? "" : `<span class="lx-tr">${r.m(c.tr)}</span>`}</p></div>`;
  const foot =
    sub === undefined
      ? ""
      : `<div class="rd-err-foot"><a href="#${sub.id}" class="lx-cover"><span class="lx-n">${num(r.topic.subtopics.indexOf(sub) + 1)}</span><span>${r.m(r.say(sub.title.id, sub.title.text))}</span></a>${ladder([sub.level], r.words, true)}<span class="lx-chev">${SVG_CHEV}</span></div>`;
  return `<article class="rd-err" data-speakers="${c.speakers.join(" ")}"><div class="rd-err-body">${wrong}${good}<div class="rd-err-rules">${c.rule}</div><ul class="rd-err-why">${c.reasons.join("")}</ul></div>${foot}</article>`;
}

// A reason of a language's speakers, headed by them, in a language.
const reason = (r: Reading, speakers: string, language: string, text: string): string =>
  `<li data-speakers="${speakers}">${tag(r.words.say("speakersOf", { language: r.words.name(speakers) }))}<span lang="${language}">${r.m(text)}</span></li>`;

// R6: the errors whose speakers are among the reader's languages, each with the reasons of those languages' speakers in the
// first language, then
// each reader language's own errors and reasons, in that language. Its three columns, the wrong form, the right form and the
// rule, stand side by side on a wide column and stack on a narrow one.
export function errors(r: Reading): string {
  const owned = (l: string): NonNullable<Reading["topic"]["own"][string]> => r.topic.own[l] ?? { blocks: [], errors: [], speakers: {} };
  const shared = r.topic.errors.flatMap((e) => {
    const reasons = r.speakers.flatMap((l) => {
      const s = e.speakers[l];
      const own = owned(l).speakers[e.id];
      return [
        ...(s === undefined ? [] : [reason(r, l, r.main, r.say(s.id, s.text))]),
        ...(own === undefined ? [] : [reason(r, l, l, own.text)]),
      ];
    });
    if (reasons.length === 0) return [];
    const right = typeof e.right === "string" ? { id: e.id, text: e.right, tr: undefined } : e.right;
    const rule = `<p class="rd-err-rule">${r.m(r.say(e.rule.id, e.rule.text))}</p>${r.others.map((l) => r.layer(l, r.in(l, e.rule.text))).join("")}`;
    const tr = right.tr === undefined ? "" : r.say(right.id, right.tr);
    return [card(r, { id: e.id, in: e.in, speakers: Object.keys(e.speakers), wrong: e.wrong, right: right.text, tr, rule, reasons })];
  });
  const own = r.languages.flatMap((l) =>
    owned(l).errors.map((e) => {
      const right = typeof e.right === "string" ? { text: e.right, tr: "" } : e.right;
      const speakers = Object.keys(e.speakers);
      const reasons = speakers.filter((s) => r.speakers.includes(s)).map((s) => reason(r, s, l, e.speakers[s]?.text ?? ""));
      const rule = `<p class="rd-err-rule" lang="${l}">${r.m(e.rule.text)}</p>`;
      return card(r, { id: e.id, in: e.in, speakers, wrong: e.wrong, right: right.text, tr: right.tr, rule, reasons });
    }),
  );
  const cards = [...shared, ...own];
  if (cards.length === 0) return "";
  return `<section class="rd-part" id="errors">${partHead("", esc(r.words.say("commonErrors")))}<div class="rd-stack">${cards.join("")}</div></section>`;
}

// The parts as the Contents list and the outline name them: part 00, the subtopics, the errors.
export function parts(r: Reading): { id: string; n: string; title: string }[] {
  return [
    { id: "essence", n: "00", title: r.words.say("essence") },
    ...r.topic.subtopics.map((s, i) => ({ id: s.id, n: num(i + 1), title: plain(parseMarks(r.say(s.title.id, s.title.text)), r.ctx) })),
    ...(errors(r) === "" ? [] : [{ id: "errors", n: "", title: r.words.say("commonErrors") }]),
  ];
}

// The interleaved reading: the head, the essence, every subtopic and the errors.
export const interleaved = (r: Reading): string =>
  head(r) + essence(r) + r.topic.subtopics.map((s, i) => subtopic(r, s, i)).join("") + errors(r);
