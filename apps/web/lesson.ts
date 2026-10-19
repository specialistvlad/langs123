// A topic page's lesson: each paragraph and list item shows its explanation over its example on an accent bar,
// the example's translation under it. The example is the item's own ex; an item without one takes it from its
// text: from an examples or exchange mark on, else from the sentence that holds the first form the rule is
// about. Tables are lesson tables (tables-html.ts).
import { filled, type Localized, type Part, type Text } from "../../scripts/lib.ts";
import { markName, textIn } from "../../scripts/text.ts";
import { type Ctx, explained, inline, learned } from "./html.ts";

// A translation as the line under an example.
export function translationOf(tr: Localized | undefined, ctx: Ctx): string {
  const value = ctx.explain === ctx.ref.lang || tr === undefined ? undefined : tr[ctx.explain];
  return value === undefined ? "" : inline(value, ctx, false);
}

export const exampleHtml = (ex: string, tr: string): string =>
  `<span class="tp-ex"><span class="tp-ex-body">${ex}${tr === "" ? "" : `<em class="tp-tr" data-mark="translation">${tr}</em>`}</span></span>`;

const BOLD = new Set(["target", "signal", "ending", "stress"]);

// Explanation text cut where its example starts: the text before it and the example, or null.
function split(value: Localized | undefined, ctx: Ctx): { head: string; ex: string } | null {
  if (value === undefined) return null;
  const text = textIn(value, ctx.explain);
  const parts: Part[] = Array.isArray(text) ? text : [text];
  const isMark = (p: Part, names: Set<string>): boolean => typeof p === "object" && !Array.isArray(p) && names.has(markName(p));
  let at = parts.findIndex((p) => isMark(p, new Set(["examples", "exchange"])));
  let cut: [Part[], Part[]] | null = at < 0 ? null : [parts.slice(0, at), parts.slice(at)];
  if (cut === null) {
    const mark = parts.findIndex((p) => isMark(p, BOLD));
    for (let j = mark - 1; mark > 0 && j >= 0 && cut === null; j--) {
      const part = parts[j];
      if (typeof part !== "string") continue;
      const boundary = [...part.matchAll(/[.!?:;] /g)].pop();
      if (boundary?.index === undefined) continue;
      at = boundary.index + 2;
      cut = [
        [...parts.slice(0, j), part.slice(0, at)],
        [part.slice(at), ...parts.slice(j + 1)],
      ];
    }
  }
  if (cut === null) return null;
  const ex = inline(cut[1], ctx, false);
  return filled(ex.replace(/<[^>]*>/g, "").trim()) ? { head: inline(cut[0], ctx, false), ex } : null;
}

// A paragraph's or a list item's content: what leads it (its badge, its variety's name), its explanation, and
// its example with the translation; an example item without an explanation is its example alone.
export function lessonText(
  lead: string,
  text: Localized | undefined,
  ex: Text | undefined,
  tr: Localized | undefined,
  ctx: Ctx,
  example: boolean,
): string {
  const under = translationOf(tr, ctx);
  if (ex !== undefined) {
    const head = explained(text, ctx);
    return `${lead}${head}${head === "" ? "" : " "}${exampleHtml(learned(ex, ctx), under)}`;
  }
  const cut = split(text, ctx);
  if (cut !== null) return `${lead}${cut.head}${exampleHtml(cut.ex, under)}`;
  if (example) return `${lead}${exampleHtml(explained(text, ctx), under)}`;
  return `${lead}${explained(text, ctx)}${under === "" ? "" : ` — <em data-mark="translation">${under}</em>`}`;
}
