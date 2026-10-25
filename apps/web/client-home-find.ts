// The Home's search on the page (search/<language>.json, pages/home-search.ts): the ranking and the filters live in
// search-find.ts and search-index.ts, which the build, the tests and other apps share; here, the page's elements.

export {
  type Filters,
  filtered,
  find,
  type Result,
  resultOf,
  results,
  type SearchData,
  suggest,
  type Topic,
  topicsOf,
} from "./search-find.ts";
export { tokens } from "./search-index.ts";

export const el = (tag: string, className = "", text?: string): HTMLElement => {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
