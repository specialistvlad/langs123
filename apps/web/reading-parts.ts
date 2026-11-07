// The parts of a topic around its subtopics (R1, R4, R7): the head with the levels, the reading time and the definition in
// every reader language, and part 00, the essence's linked lines with the picture of a topic that has one; the common errors
// are reading-errors.ts, and interleaved() puts the parts together.
import type { Translated } from "../../scripts/generated/export-v1.ts";
import { type Ground, sceneGrid } from "./pictures.ts";
import type { Reading } from "./reading.ts";
import { subtopic } from "./reading-blocks.ts";
import { errors } from "./reading-errors.ts";
import { esc, marks, parseMarks, plain, tag, varietyLabel } from "./reading-marks.ts";
import { formText, ladder, LEVELS, partHead, pill, SVG_CHEV, SVG_CLOCK } from "./reading-words.ts";

type Line = Reading["topic"]["essence"][number];
interface Gloss {
  id: string;
  text: Translated | undefined;
}

const num = (n: number): string => String(n).padStart(2, "0");

// R1: the head under the title, with the topic's levels and its reading time in the first language, and its definition in
// every reader language, the others under the first with their tags (side by side sets each language's in its column).
export function head(r: Reading, lead = true): string {
  const minutes = String(r.topic.minutes[r.main] ?? r.topic.minutes[r.source] ?? 1);
  const first = `<p class="lx-lead">${r.m(r.say(r.topic.definition.id, r.topic.definition.text))}</p>`;
  const more = r.layers((l) => r.in(l, r.topic.definition.text));
  const definition = !lead ? "" : more === "" ? first : `<div class="rd-blk">${first}${more}</div>`;
  return (
    `<header class="rd-head"><p class="lx-meta">${ladder(r.topic.levels, r.words, false, "topic")}<span class="lx-dot" aria-hidden="true"></span>` +
    `<span class="lx-meta-i">${SVG_CLOCK} ${esc(r.words.say("minutes", { n: minutes }))}</span></p>` +
    `${definition}</header>${r.pin("head")}`
  );
}

// R7: the picture's cells, each captioned with its line's form and labelled with its example and the translation in every
// reader language.
function picture(r: Reading): string {
  const data = r.topic.picture;
  if (data === undefined) return "";
  const lines = new Map(r.topic.essence.map((e) => [e.id, e]));
  const cells = data.cells.flatMap((c) => {
    const e = lines.get(c.line);
    if (e === undefined || !r.shows(e.variety)) return [];
    const ex = e.ex;
    const said = ex === undefined ? [] : [plain(parseMarks(ex.text), r.ctx), r.say(ex.id, ex.tr), ...r.others.map((l) => r.in(l, ex.tr))];
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
  return `<div class="rd-pic">${sceneGrid(cells)}</div>${r.pin(data.id)}`;
}

// The levels of the essence's shown lines, lowest first: part 00's head carries their range as a subtopic's head carries
// its level.
export function essenceLevels(r: Reading): string[] {
  const on = new Set<string>(r.topic.essence.filter((e) => r.shows(e.variety)).map((e) => e.level ?? "A1"));
  return LEVELS.filter((l) => on.has(l));
}

const still = (r: Reading, text: string): string => marks(text, { ...r.ctx, still: true });

// The form an essence line leads with and the gloss under it: a line with a transcription leads with its form, the sound and
// its example word, the word's translation its gloss; a line with a sentence leads with it; the rest lead with their form,
// their text the gloss. Marks draw still, the row being one tap target.
export function essenceLine(r: Reading, e: Line): { form: string; gloss?: Gloss } {
  const joiner = '<span class="lx-j" aria-hidden="true"></span>';
  if (e.ipa !== undefined) {
    const form = `${still(r, formText(e.form))}${joiner}${still(r, `{ipa ${e.ipa}}`)}`;
    return e.ex === undefined ? { form } : { form: `${form}${joiner}${still(r, e.ex.text)}`, gloss: { id: e.ex.id, text: e.ex.tr } };
  }
  if (e.ex !== undefined) return { form: still(r, e.ex.text), gloss: { id: e.ex.id, text: e.ex.tr } };
  const variety = e.variety === undefined ? "" : `${tag(varietyLabel(e.variety, r.ctx))} `;
  const form = `${variety}<b class="lx-b">${still(r, formText(e.form))}</b>`;
  return e.text === undefined ? { form } : { form, gloss: { id: e.id, text: e.text } };
}

// R4 and R7: part 00, its head carrying the range of its lines' levels, the essence's lines in the first language with each
// other language's gloss under them, each linked to the subtopic that teaches it, in two cards on a wide column. A line
// carries its level as the level's pill only where the topic's subtopics span more than one level, as the head's mark says
// the rest.
export function essence(r: Reading): string {
  const levelled = new Set(r.topic.subtopics.map((s) => s.level)).size > 1;
  const rows = r.topic.essence
    .filter((e) => r.shows(e.variety))
    .map((e) => {
      const { form, gloss } = essenceLine(r, e);
      const text = gloss === undefined ? "" : r.say(gloss.id, gloss.text);
      const more =
        gloss === undefined
          ? ""
          : r.layers(
              (l) => r.in(l, gloss.text),
              "lx-row-sub rd-trl",
              (t) => still(r, t),
            );
      const sub = (text === "" ? "" : `<span class="lx-row-sub">${still(r, text)}</span>`) + more;
      const to = e.to === undefined ? "" : ` href="#${e.to}"`;
      const mark = levelled ? pill(e.level ?? "A1", r.words) : "";
      return `<div class="lx-row"><a${to} class="lx-row-a lx-cover"><span class="lx-row-t">${form}${sub}</span></a>${mark}<span class="lx-chev">${SVG_CHEV}</span></div>${r.pin(e.id)}`;
    });
  const half = Math.ceil(rows.length / 2);
  const cards = [rows.slice(0, half), rows.slice(half)].filter((c) => c.length > 0).map((c) => `<div class="lx-card">${c.join("")}</div>`);
  const levels = essenceLevels(r);
  const mark = levels.length === 0 ? "" : ladder(levels, r.words, false, "essence");
  return `<section class="rd-part" id="essence">${partHead("00", esc(r.words.say("essence")), mark)}${picture(r)}<div class="rd-two">${cards.join("")}</div></section>`;
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
