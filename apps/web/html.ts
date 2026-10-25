// Text as HTML: escaping, and the marks of the data as elements that name what each piece is
// (CONVENTIONS.md §12): bold for a form or a word a rule is about, italics for a sound or a meaning.
import { type Explain, type Localized, type Mark, slotName, type Text, type TopicRef, type Variety } from "../../scripts/lib.ts";
import { type FoldContext, foldText, type MarkName, reading, textIn, type TextOutput } from "../../scripts/text.ts";
import { LEARNED } from "../../scripts/text-walk.ts";

// Turns a topic ID into a page URL; null marks a topic without a page yet.
export type LinkFn = (target: TopicRef | undefined, explain: Explain, from: TopicRef) => string | null;

// One topic rendered in one explanation language. A language being learned with varieties names them:
// its elements tagged with a variety show only while the reader has chosen that variety.
export interface Ctx {
  ref: TopicRef;
  explain: Explain;
  refs: TopicRef[];
  link: LinkFn;
  varieties?: Variety[] | undefined;
  // A copy of a table cell in one variety.
  pick?: Variety | undefined;
  // A topic page's lesson (lesson.ts): the joiners of a list and the slashes of a transcription muted, the name of
  // a variety before its form in bold, and a hyphen that opens a word kept with it.
  lesson?: boolean;
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);
}

// Marks shown in bold, as the form or word a rule is about; marks shown in italics, as a sound or a meaning.
export const STRONG = new Set<MarkName>(["target", "aux", "subj", "verb", "ending", "stress", "term", "letter", "signal"]);
export const EMPHASIS = new Set<MarkName>(["sound", "l1", "gloss"]);

// On a page in another language than the one being learned, every piece names its language for screen
// readers: a form of the language being learned inside an explanation, and a gloss or a named slot inside
// an example. A variant names its variety beside its form, so it takes the language of the text around it.
function markLang(name: MarkName, m: Mark, c: FoldContext, ctx: Ctx): string {
  if (ctx.explain === ctx.ref.lang) return "";
  if (!c.plain) return LEARNED.has(name) && name !== "variant" ? ctx.ref.lang : "";
  const slot = (m as { slot?: unknown }).slot;
  const named = name === "slot" && (typeof slot !== "string" || slotName(slot, ctx.explain) !== slot);
  return name === "gloss" || name === "l1" || named ? ctx.explain : "";
}

// A hyphen that opens a word (-s, -ed) stays with it.
const keepHyphen = (s: string): string => s.replace(/(?<![\p{L}\p{N}-])-(?=[\p{L}\p{N}])/gu, "\u2011");
const LESSON: Pick<TextOutput<string>, "joiner" | "ipa" | "label"> = {
  joiner: (sep) => {
    const m = /^ ([/·→=≠+—]) $/.exec(sep);
    return m === null ? escapeHtml(sep) : ` <i class="j">${escapeHtml(m[1] ?? "")}</i> `;
  },
  ipa: (t) => `<i class="sl">/</i>${escapeHtml(t)}<i class="sl">/</i>`,
  label: (name) => `<b class="vl">${escapeHtml(name)}</b>`,
};

function htmlOutput(ctx: Ctx): TextOutput<string> {
  return {
    ...(ctx.lesson === true ? LESSON : {}),
    text: ctx.lesson === true ? (s) => keepHyphen(escapeHtml(s)) : escapeHtml,
    join: (parts) => parts.join(""),
    ruby: (kanji, kana) => `<ruby>${kanji}<rt>${escapeHtml(kana)}</rt></ruby>`,
    mark(name: MarkName, inner: string, m: Mark, c: FoldContext): string {
      const lang = markLang(name, m, c, ctx);
      const attrs = ` data-mark="${name}"${lang === "" ? "" : ` lang="${lang}"`}`;
      if (STRONG.has(name)) return `<strong${attrs}>${inner}</strong>`;
      if (EMPHASIS.has(name)) return `<em${attrs}>${inner}</em>`;
      if (name === "link") {
        const to = (m as { to: string }).to;
        const href = ctx.link(
          ctx.refs.find((r) => r.id === to),
          ctx.explain,
          ctx.ref,
        );
        return href === null ? `<span class="missing"${attrs}>${inner}</span>` : `<a href="${href}"${attrs}>${inner}</a>`;
      }
      const value = (m as { value?: string | number }).value;
      const variety = (m as { variety?: string }).variety;
      const extra =
        (value === undefined ? "" : ` data-value="${escapeHtml(String(value))}"`) +
        (variety === undefined ? "" : ` data-variety="${variety}"`);
      const shown =
        name === "variant" && c.swap === true && c.pick === undefined ? varietyLabel(m as { variety: Variety }, c, ctx, inner) : inner;
      // A short mapping in a lesson keeps to one line.
      const nowrap = ctx.lesson === true && name === "mapping" && !shown.includes("<") && shown.length <= 30 ? ' class="nw"' : "";
      return `<span${attrs}${nowrap}${extra}>${shown}</span>`;
    },
    swap: (variants) => variants.join(""),
  };
}

// A variant shows its form; its variety's name stays for screen readers and copied text.
function varietyLabel(m: { variety: Variety }, c: FoldContext, ctx: Ctx, form: string): string {
  const lang = ctx.explain === ctx.ref.lang ? "" : ` lang="${ctx.explain}"`;
  const label = `<span class="sr-only"${lang}>${c.plain ? "(" : ""}${escapeHtml(c.variety(m.variety))}: </span>`;
  return label + form + (c.plain ? `<span class="sr-only">)</span>` : "");
}

// Text in the language being learned (plain) or explaining it; examples in a summary read as sentences.
// Text in the language being learned, on a page in another language, names its language.
export function inline(value: Text, ctx: Ctx, plain: boolean, sentences = false): string {
  const html = foldText(value, htmlOutput(ctx), {
    ...reading(ctx.explain, plain),
    sentences,
    swap: ctx.varieties !== undefined,
    ...(ctx.pick === undefined ? {} : { pick: ctx.pick }),
  });
  return plain && ctx.explain !== ctx.ref.lang && html !== "" ? `<span lang="${ctx.ref.lang}">${html}</span>` : html;
}

// Explanation text in the reader's language.
export const explained = (value: Localized | undefined, ctx: Ctx): string =>
  value === undefined ? "" : inline(textIn(value, ctx.explain), ctx, false);
// Text in the language being learned.
export const learned = (value: Text | undefined, ctx: Ctx): string => (value === undefined ? "" : inline(value, ctx, true));

// A translation into the reader's language, when it differs from the language being learned.
export function translation(tr: Localized | undefined, ctx: Ctx): string {
  const value = ctx.explain === ctx.ref.lang || tr === undefined ? undefined : tr[ctx.explain];
  return value === undefined ? "" : ` — <em data-mark="translation">${inline(value, ctx, false)}</em>`;
}
