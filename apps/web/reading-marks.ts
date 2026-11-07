// The marks of the new library's text as HTML, for the reading (reading-*.ts): `{mark content}` pieces, nested;
// `{variant en-GB text}` carries its variety and `{l1 uk text}` its language. A target is the word a line teaches, a term
// an English word compared with it, an ipa a transcription between slashes, an l1 a phrase in another language in that
// language's quotation marks. With one variety chosen the forms of the others drop; with "all" each shows with its name.
export type Node = string | { mark: string; arg?: string; kids: Node[] };

export interface Ctx {
  // "all" or a variety's code.
  variety: string;
  // Target marks draw as the corrected word of an error.
  fix?: boolean;
  // A variant shows the chosen form as text with no tap, inside an essence row, which is one tap target.
  still?: boolean;
  // A variety's name in the reader's language (the interface's `varieties`), where the reading has the wording.
  name?: (code: string) => string | undefined;
  // The hint a variant's button carries after its form and variety: a tap switches the variety (the wording's variantTap).
  tap?: string;
}

// The short names of the varieties, on a capsule, where no wording names them.
export const VARIETIES: Record<string, string> = { "en-GB": "GB", "en-US": "US", "es-419": "Latin America", "es-ES": "Spain" };
export const varietyLabel = (code: string, ctx?: Ctx): string => ctx?.name?.(code) ?? VARIETIES[code] ?? code;

export const esc = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const tag = (label: string): string => `<span class="lx-capsule">${esc(label)}</span>`;
const SL = '<i class="lx-sl">/</i>';
export const ipa = (inner: string): string => `<span class="lx-ipa">${SL}${inner}${SL}</span>`;

// The quotation marks of a phrase in its language (the l1 mark), the fallback for a language the table lacks: French sets a
// no-break space inside its guillemets. api.ts gives the table to the apps that read the library.
export const l1Quotes: { fallback: readonly [string, string]; languages: Readonly<Record<string, readonly [string, string]>> } = {
  fallback: ["“", "”"],
  languages: {
    en: ["‘", "’"],
    uk: ["«", "»"],
    es: ["«", "»"],
    it: ["«", "»"],
    fr: ["« ", " »"],
    de: ["„", "“"],
    pl: ["„", "”"],
    ja: ["「", "」"],
  },
};

export function parseMarks(src: string): Node[] {
  let i = 0;
  const run = (closing: boolean): Node[] => {
    const out: Node[] = [];
    let text = "";
    const flush = (): void => {
      if (text !== "") out.push(text);
      text = "";
    };
    while (i < src.length) {
      const ch = src.charAt(i);
      if (ch === "{") {
        flush();
        const space = src.indexOf(" ", i + 1);
        const mark = src.slice(i + 1, space);
        i = space + 1;
        let arg: string | undefined;
        if (mark === "variant" || mark === "l1") {
          const next = src.indexOf(" ", i);
          arg = src.slice(i, next);
          i = next + 1;
        }
        out.push({ mark, ...(arg !== undefined && { arg }), kids: run(true) });
      } else if (ch === "}" && closing) {
        i++;
        flush();
        return out;
      } else {
        text += ch;
        i++;
      }
    }
    flush();
    return out;
  };
  return run(false);
}

// Where a variety's form drops it leaves this mark, a character of the private use area. The space that separates two
// forms belongs to their mark: closeGaps(), run on each mark's content and on the whole text, takes the mark out with the
// spaces beside it where the content starts or ends or punctuation follows, and leaves one space between two words.
const DROP = "\uE000";
function closeGaps(text: string): string {
  return text
    .replace(/\uE000(\s*\uE000)+/g, DROP)
    .replace(/^\s*\uE000\s*/, "")
    .replace(/\s*\uE000\s*(?=[?!.,;:…)\]»”’]|$)/g, "")
    .replace(/\s*\uE000\s*/g, (m) => (/\s/.test(m) ? " " : ""));
}

// Marked text as plain text, for captions and alternative texts: the varieties side by side read "opposite / across from".
export function plain(nodes: Node[], ctx: Ctx): string {
  let seen = false;
  const text = nodes
    .map((n): string => {
      if (typeof n === "string") return n;
      if (n.mark !== "variant") return plain(n.kids, ctx);
      if (ctx.variety !== "all") return n.arg === ctx.variety ? plain(n.kids, ctx) : DROP;
      const lead = seen ? " / " : "";
      seen = true;
      return lead + plain(n.kids, ctx);
    })
    .join("");
  return closeGaps(text).replace(/\s+/g, " ").trim();
}

function render(nodes: Node[], ctx: Ctx, inIpa = false): string {
  return nodes
    .map((n): string => {
      if (typeof n === "string") return esc(n);
      const inner = (nested = inIpa): string => closeGaps(render(n.kids, ctx, nested));
      const arg = n.arg ?? "";
      switch (n.mark) {
        case "target":
          return ctx.fix === true ? `<span class="rd-fix">${inner()}</span>` : `<b class="lx-b">${inner()}</b>`;
        case "term":
          return `<b class="rd-term">${inner()}</b>`;
        case "ipa":
          return n.kids.some((k) => typeof k !== "string" && k.mark === "variant") ? inner(true) : ipa(inner(true));
        case "variant": {
          if (ctx.variety === "all") return `<span class="rd-vr">${tag(varietyLabel(arg, ctx))}${inIpa ? ipa(inner()) : inner()}</span>`;
          if (arg !== ctx.variety) return DROP;
          const form = inIpa ? ipa(inner()) : inner();
          if (ctx.still === true) return form;
          const hint = ctx.tap === undefined ? "" : `; ${esc(ctx.tap)}`;
          return `<button type="button" class="rd-var" data-variety="${esc(arg)}" aria-label="${esc(plain(n.kids, ctx))}, ${esc(varietyLabel(arg, ctx))}${hint}">${form}</button>`;
        }
        case "l1": {
          const [open, close] = l1Quotes.languages[arg] ?? l1Quotes.fallback;
          return `<span class="rd-l1" lang="${esc(arg)}">${open}${inner()}${close}</span>`;
        }
        default:
          return inner();
      }
    })
    .join("");
}

// Marked text as HTML; with a chosen variety the forms of the others drop and the gaps close.
export function marks(src: string, ctx: Ctx): string {
  const html = render(parseMarks(src), ctx);
  return ctx.variety === "all"
    ? html
    : closeGaps(html)
        .replace(/\s{2,}/g, " ")
        .trim();
}
