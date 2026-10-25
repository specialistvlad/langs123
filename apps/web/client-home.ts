// The Home's toolbar (pages/home.ts): the search lists the topics of every course that match, in two columns where
// two of at least 320px fit; the filters under the field narrow them (client-search-filters.ts); Close, Escape and the
// clear button end or empty it; the Read in menu closes on a tap outside it; on phones the toolbar rises above the
// on-screen keyboard (--hm-kb, home-phone.css).
import { el, type Result, results as searchResults, type SearchData, tokens, type Topic, topicsOf } from "./client-home-find.ts";
import { addLevelEntries } from "./client-levels.ts";
import { searchFilters } from "./client-search-filters.ts";
import { type Index, partOf } from "./search-index.ts";

// One result row: the course's flag and the topic's title, a link over the whole row; its small level mark, a button
// that opens the level popover, with its range in words on wide screens; the language it opens in when it is not the
// page's; and its lead with the terms in bold.
function row({ topic, caption, lead }: Result, scale: string[]): HTMLElement {
  const item = el("div", "hm-row");
  const head = el("span", "hm-row-head");
  const a = el("a", "hm-row-a") as HTMLAnchorElement;
  a.href = topic.url;
  if (topic.other !== "") a.hreflang = topic.otherLang;
  const flag = el("span", "hm-row-flag", topic.flag);
  flag.setAttribute("role", "img");
  flag.setAttribute("aria-label", topic.course);
  a.append(flag, topic.title);
  const mark = el("button", "lvm lvm-sm lvm-b");
  mark.setAttribute("type", "button");
  mark.setAttribute("popovertarget", "lv-pop");
  mark.setAttribute("aria-haspopup", "dialog");
  mark.dataset["lv"] = `s${String(topic.order)}`;
  mark.setAttribute("aria-label", topic.levels.join(", "));
  for (const level of scale) mark.append(el("i", topic.levels.includes(level) ? `lv-${level} on` : `lv-${level}`));
  const [from = "", to = from] = [topic.levels[0], topic.levels.at(-1)];
  mark.append(el("span", "lvm-t", from === to ? from : `${from}–${to}`));
  head.append(a, mark);
  item.append(head);
  if (caption !== "") item.append(el("span", "hm-row-cap", caption));
  const text = el("span", "hm-row-text");
  for (const [run, bold] of lead) text.append(bold ? el("b", "", run) : run);
  item.append(text);
  return item;
}

export function homeSearch(): void {
  const root = document.documentElement;
  const $ = (id: string): HTMLElement | null => document.getElementById(id);
  const input = $("hm-q") as HTMLInputElement | null;
  const [form, clear, close, cards, results, list, none] = [
    "hm-form",
    "hm-clear",
    "hm-close",
    "hm-cards",
    "hm-results",
    "hm-list",
    "hm-none",
  ].map($);
  if (!input || !form || !clear || !close || !cards || !results || !list) return;
  const heading = results.querySelector<HTMLElement>(".hm-heading");
  let topics: Topic[] | null = null;
  let parts = new Set<string>();
  const index: Index = {};
  let words: string[] = [];
  let scale: string[] = [];
  let loading: Promise<void> | null = null;
  let version = 0;
  const load = (): Promise<void> =>
    (loading ??= fetch(`/search/${root.lang}.json`)
      .then((r) => r.json() as Promise<SearchData>)
      .then((data) => {
        topics = topicsOf(data);
        parts = new Set(data.parts);
        scale = data.levels;
        addLevelEntries(Object.fromEntries(topics.map((t) => [`s${String(t.order)}`, { t: t.title, k: "topic" as const, l: t.entry }])));
      })
      .catch(() => {
        loading = null;
      }));
  // The parts of the index the terms start with, each fetched once.
  const loaded = new Map<string, Promise<void>>();
  const loadParts = (terms: string[]): Promise<unknown> =>
    Promise.all(
      [...new Set(terms.map(partOf))]
        .filter((part) => parts.has(part))
        .map((part) => {
          let got = loaded.get(part);
          if (got === undefined) {
            got = fetch(`/search/${root.lang}/${part}.json`)
              .then((r) => r.json() as Promise<Index>)
              .then((more) => {
                Object.assign(index, more);
                words = Object.keys(index);
              })
              .catch(() => {
                loaded.delete(part);
              });
            loaded.set(part, got);
          }
          return got;
        }),
    );

  async function update(): Promise<void> {
    if (!input || !clear || !close || !cards || !results || !list) return;
    const mine = ++version;
    clear.hidden = input.value === "";
    const terms = tokens(input.value);
    const on = terms.length > 0;
    // A query hides the page's header, as the results take its place.
    root.classList.toggle("hm-query", on);
    results.hidden = !on;
    cards.hidden = on;
    if (!on) return;
    await load();
    await loadParts(terms);
    if (mine !== version || topics === null) return;
    const found = searchResults(topics, index, words, input.value, filters(), scale, results.dataset["explained"] ?? "");
    list.replaceChildren();
    if (heading) heading.textContent = (heading.dataset["count"] ?? "").replace("{n}", String(found.length));
    if (heading) heading.hidden = found.length === 0;
    if (none) {
      none.hidden = found.length > 0;
      const title = none.querySelector<HTMLElement>(".hm-none-t");
      if (title) title.textContent = (title.dataset["query"] ?? "").replace("{query}", input.value.trim());
    }
    // The first half fills the left card, so the order reads down the left, then down the right.
    const half = Math.ceil(found.length / 2);
    for (const part of found.length > 1 ? [found.slice(0, half), found.slice(half)] : found.length > 0 ? [found] : []) {
      const rows = el("div", "hm-rows");
      rows.append(...part.map((result) => row(result, scale)));
      list.append(rows);
    }
  }
  const filters = searchFilters(() => void update());
  const stop = (): void => {
    input.value = "";
    input.blur();
    root.classList.remove("hm-searching");
    void update();
  };

  input.addEventListener("focus", () => {
    root.classList.add("hm-searching");
    void load();
  });
  input.addEventListener("input", () => void update());
  clear.addEventListener("click", () => {
    input.value = "";
    input.focus();
    void update();
  });
  close.addEventListener("click", stop);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    list.querySelector("a")?.click();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("hm-searching")) stop();
  });
  // The Read in menu closes on a tap outside it.
  const read = document.querySelector<HTMLDetailsElement>(".hm-read");
  document.addEventListener("click", (event) => {
    if (read?.open === true && event.target instanceof Node && !read.contains(event.target)) read.open = false;
  });
  // The toolbar rises above the on-screen keyboard.
  const view = window.visualViewport;
  if (view) {
    const rise = (): void => {
      const height = Math.max(0, innerHeight - view.height - view.offsetTop);
      root.style.setProperty("--hm-kb", `${String(height > 80 ? height : 0)}px`);
    };
    view.addEventListener("resize", rise);
    view.addEventListener("scroll", rise);
  }
}
