// The common errors of the reading (R6): the errors whose speakers are among the reader's languages, each as a card with its
// wrong form, its right form and its rule in every reader language, one reason per speaker language, and the subtopic it
// belongs to; then each reader language's own errors. The card's columns follow the reading column (reading-web.css).
import type { Translated } from "../../scripts/generated/export-v1.ts";
import type { Reading } from "./reading.ts";
import { esc, marks, tag } from "./reading-marks.ts";
import { ladder, partHead, SVG_CHEV, SVG_TICK, SVG_X } from "./reading-words.ts";

const num = (n: number): string => String(n).padStart(2, "0");

// An error's card: the wrong form, the right form with its translation in every reader language, the rule in every reader
// language, the reasons, and the subtopic it belongs to.
interface Card {
  id: string;
  in: string;
  speakers: string[];
  wrong: string;
  right: string;
  tr: string;
  trs: string;
  rule: string;
  reasons: string[];
}
function card(r: Reading, c: Card): string {
  const sub = r.topic.subtopics.find((s) => s.id === c.in);
  const tagged = r.others.length > 0;
  const wrong = `<span class="rd-err-i rd-err-w">${SVG_X}</span><p class="rd-err-w"><span class="rd-wrong">${r.m(c.wrong)}</span></p>`;
  const good = `<span class="rd-err-i rd-err-r">${SVG_TICK}</span><p class="rd-err-r">${marks(c.right, { ...r.ctx, fix: true })}${c.tr === "" ? "" : `<span class="lx-tr">${r.m(c.tr)}</span>`}${c.trs}</p>`;
  // From 640 the card stands in columns (reading-web.css): the wrong form, the right form and the rule; with other languages
  // the two forms share one column and the rules take the other.
  const columns = tagged
    ? `<div class="rd-err-c">${wrong}${good}</div>`
    : `<div class="rd-err-c">${wrong}</div><div class="rd-err-c">${good}</div>`;
  const foot =
    sub === undefined
      ? ""
      : `<div class="rd-err-foot"><a href="#${sub.id}" class="lx-cover"><span class="lx-n">${num(r.topic.subtopics.indexOf(sub) + 1)}</span><span>${r.m(r.say(sub.title.id, sub.title.text))}</span></a>${ladder([sub.level], r.words, true)}<span class="lx-chev">${SVG_CHEV}</span></div>`;
  return `<article class="rd-err ${tagged ? "rd-err-2" : "rd-err-3"}" data-speakers="${c.speakers.join(" ")}"><div class="rd-err-body">${columns}<div class="rd-err-rules">${c.rule}</div><ul class="rd-err-why">${c.reasons.join("")}</ul></div>${foot}</article>`;
}

// A reason of a language's speakers, headed by them, in a language.
const reason = (r: Reading, speakers: string, language: string, text: string): string =>
  `<li data-speakers="${speakers}">${tag(r.words.say("speakersOf", { language: r.words.name(speakers) }))}<span lang="${language}">${r.m(text)}</span></li>`;

// R6: the errors whose speakers are among the reader's languages, each with its right form and its rule in every reader
// language and one reason per speaker language, in its speakers' own language where the reader knows it and otherwise in
// the first; then each reader language's own errors and reasons, in that language. The card's three columns, the wrong
// form, the right form and the rule, stand side by side on a wide column and stack on a narrow one.
export function errors(r: Reading): string {
  const owned = (l: string): NonNullable<Reading["topic"]["own"][string]> => r.topic.own[l] ?? { blocks: [], errors: [], speakers: {} };
  const translations = (tr: Translated | undefined): string => r.layers((l) => r.in(l, tr), "lx-tr rd-trl");
  const rules = (text: Translated | undefined): string =>
    r.others
      .map((l) => {
        const t = r.in(l, text);
        return t === "" ? "" : `<p class="rd-err-rule rd-lang" lang="${l}">${tag(l.toUpperCase())}<span>${r.m(t)}</span></p>`;
      })
      .join("");
  const shared = r.topic.errors.flatMap((e) => {
    const reasons = r.speakers.flatMap((l) => {
      const s = e.speakers[l];
      const own = owned(l).speakers[e.id];
      if (s === undefined && own === undefined) return [];
      // Once: the language file's own reason or the layer's text where the reader knows the speakers' language, else the first.
      const theirs = own?.text ?? (s !== undefined && l !== r.main ? r.in(l, s.text) : "");
      const [language, text] =
        r.languages.includes(l) && theirs !== "" ? [l, theirs] : s === undefined ? [l, theirs] : [r.main, r.say(s.id, s.text)];
      return [reason(r, l, language, text)];
    });
    if (reasons.length === 0) return [];
    const right = typeof e.right === "string" ? { id: e.id, text: e.right, tr: undefined } : e.right;
    const rule = `<p class="rd-err-rule">${r.m(r.say(e.rule.id, e.rule.text))}</p>${rules(e.rule.text)}`;
    const tr = right.tr === undefined ? "" : r.say(right.id, right.tr);
    const c = {
      id: e.id,
      in: e.in,
      speakers: Object.keys(e.speakers),
      wrong: e.wrong,
      right: right.text,
      tr,
      trs: translations(right.tr),
      rule,
      reasons,
    };
    return [card(r, c) + r.pin(e.id)];
  });
  const own = r.languages.flatMap((l) =>
    owned(l).errors.map((e) => {
      const right = typeof e.right === "string" ? { text: e.right, tr: "" } : e.right;
      const speakers = Object.keys(e.speakers);
      const reasons = speakers.filter((s) => r.speakers.includes(s)).map((s) => reason(r, s, l, e.speakers[s]?.text ?? ""));
      const rule = `<p class="rd-err-rule" lang="${l}">${r.m(e.rule.text)}</p>`;
      return (
        card(r, { id: e.id, in: e.in, speakers, wrong: e.wrong, right: right.text, tr: right.tr, trs: "", rule, reasons }) + r.pin(e.id)
      );
    }),
  );
  const cards = [...shared, ...own];
  if (cards.length === 0) return "";
  return `<section class="rd-part" id="errors">${partHead("", esc(r.words.say("commonErrors")))}<div class="rd-stack">${cards.join("")}</div></section>`;
}
