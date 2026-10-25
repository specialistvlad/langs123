// The Home's search on the page (search/<language>.json, pages/home-search.ts): the ranking and the filters live in
// search-index.ts, which the build and the tests share; here, the text with each place a term appears in bold.
import { fold } from "./search-index.ts";

export { type Filters, filtered, find, type SearchData, type Topic, topicsOf } from "./search-find.ts";
export { tokens } from "./search-index.ts";

export const el = (tag: string, className = "", text?: string): HTMLElement => {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// The text with each place a term appears in bold. Matching runs on the folded text; each folded letter
// remembers where it came from, so the bold run is cut from the original, marks included.
export function marked(text: string, terms: string[]): DocumentFragment {
  const out = document.createDocumentFragment();
  let plain = "";
  const origin: number[] = [];
  for (let i = 0; i < text.length; i++) {
    for (const c of fold(text[i] ?? "")) {
      plain += c;
      origin.push(i);
    }
  }
  const spans: [number, number][] = [];
  for (const term of terms) {
    for (let at = plain.indexOf(term); at >= 0; at = plain.indexOf(term, at + term.length)) {
      let to = (origin[at + term.length - 1] ?? 0) + 1;
      while (to < text.length && /\p{M}/u.test(text[to] ?? "")) to++;
      spans.push([origin[at] ?? 0, to]);
    }
  }
  spans.sort((a, b) => a[0] - b[0]);
  let end = 0;
  for (const [from, to] of spans) {
    if (to <= end) continue;
    const start = Math.max(from, end);
    if (start > end) out.append(text.slice(end, start));
    out.append(el("b", "", text.slice(start, to)));
    end = to;
  }
  if (end < text.length) out.append(text.slice(end));
  return out;
}
