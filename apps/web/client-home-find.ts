// The Home's search on the page (search/<language>.json, pages/home-search.ts): the ranking and the filters live in
// search-index.ts, which the build and the tests share; here, the text with each place a term appears in bold.
import { boldRuns } from "./search-find.ts";

export { type Filters, filtered, find, type SearchData, type Topic, topicsOf } from "./search-find.ts";
export { tokens } from "./search-index.ts";

export const el = (tag: string, className = "", text?: string): HTMLElement => {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// The text with each place a term appears in bold (search-find.ts, boldRuns).
export function marked(text: string, terms: string[]): DocumentFragment {
  const out = document.createDocumentFragment();
  for (const [run, bold] of boldRuns(text, terms)) out.append(bold ? el("b", "", run) : run);
  return out;
}
