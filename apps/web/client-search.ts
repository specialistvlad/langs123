// The top bar's search: the field shows once this script runs and fetches its search data on the first
// focus. Typing lists the matching topics, then the sections inside topics, under the field; rows above
// the level the filter shows come after the others, dimmed, as the rail greys its entries. ↑ and ↓ move
// through the rows, Enter opens one, Escape closes the list and gives the focus back; "/" or ⌘K/Ctrl+K
// moves to the field. On phones a button opens the field and its list over the whole screen.
import { type Hit, highlight, search, type SearchData } from "./search-match.ts";

const PHONE = "(max-width: 860px)";
const escape = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function topSearch(): void {
  const box = document.querySelector<HTMLElement>(".top-search");
  const input = box?.querySelector("input");
  const list = box?.querySelector<HTMLElement>(".search-results");
  if (box && input && list) wire(box, input, list, document.querySelector<HTMLElement>(".search-open"));
}

function wire(box: HTMLElement, input: HTMLInputElement, list: HTMLElement, opener: HTMLElement | null): void {
  box.hidden = false;
  if (opener) opener.hidden = false;
  const levels = (box.dataset["levels"] ?? "").split(" ");
  const isOpen = (): boolean => list.hidden === false;
  let data: Promise<SearchData[]> | null = null;
  let active = -1;
  let returnTo: HTMLElement | null = null;

  const load = (): Promise<SearchData[]> =>
    (data ??= Promise.all(
      (box.dataset["search"] ?? "")
        .split(" ")
        .filter(Boolean)
        .map((url) => fetch(url).then((r) => r.json() as Promise<SearchData>)),
    ).catch(() => []));
  const options = (): HTMLElement[] => [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  const mark = (n: number): void => {
    const rows = options();
    active = rows.length === 0 ? -1 : (n + rows.length) % rows.length;
    rows.forEach((row, i) => row.classList.toggle("active", i === active));
    const row = rows[active];
    if (row) {
      input.setAttribute("aria-activedescendant", row.id);
      row.scrollIntoView({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  };
  const show = (open: boolean): void => {
    list.hidden = !open;
    input.setAttribute("aria-expanded", String(open));
    if (!open) {
      active = -1;
      input.removeAttribute("aria-activedescendant");
    }
  };
  const close = (): void => {
    show(false);
    document.body.classList.remove("search-full");
  };
  const many = (box.dataset["search"] ?? "").split(" ").filter(Boolean).length > 1;
  const row = (h: Hit, n: number): string => {
    const where = many && h.entry.kind === "topic" ? `${h.entry.context} · ${h.track}` : h.entry.context;
    return `<a role="option" id="search-${n}" href="${escape(h.entry.url)}"${h.above ? ' class="above"' : ""}><span class="hit-title">${highlight(h.entry.title, h.marks, escape)}</span><span class="hit-where">${escape(where)}</span>${h.entry.badge}</a>`;
  };
  const render = async (): Promise<void> => {
    const query = input.value.trim();
    if (query === "") {
      list.innerHTML = "";
      show(false);
      return;
    }
    const found = search(await load(), query, document.documentElement.dataset["level"] ?? "", levels);
    if (input.value.trim() !== query) return;
    let n = 0;
    const group = (id: string, title: string | undefined, hits: Hit[]): string =>
      hits.length === 0
        ? ""
        : `<div role="group" aria-labelledby="${id}"><p class="hit-group" id="${id}">${escape(title ?? "")}</p>${hits.map((h) => row(h, n++)).join("")}</div>`;
    const body =
      group("search-topics", box.dataset["topics"], found.topics) + group("search-sections", box.dataset["inTopics"], found.sections);
    list.innerHTML = body === "" ? `<p class="hit-empty">${escape(box.dataset["empty"] ?? "")}</p>` : body;
    show(true);
    mark(0);
  };
  const focusSearch = (): void => {
    const was = document.activeElement;
    returnTo = was instanceof HTMLElement && was !== input ? was : null;
    if (matchMedia(PHONE).matches) document.body.classList.add("search-full");
    input.focus();
    input.select();
  };

  // The first focus fetches the search data; a focus back on a typed query lists it again.
  input.addEventListener("focus", () => {
    void load();
    if (!isOpen() && input.value.trim() !== "") void render();
  });
  input.addEventListener("input", () => void render());
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!isOpen()) return;
      event.preventDefault();
      mark(active + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter") {
      const rowEl = options()[active];
      if (!isOpen() || !rowEl) return;
      event.preventDefault();
      location.assign(rowEl.getAttribute("href") ?? "");
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
      if (returnTo?.isConnected === true) returnTo.focus();
      else input.blur();
    }
  });
  list.addEventListener("mousemove", (event) => {
    const rowEl = (event.target as Element).closest<HTMLElement>('[role="option"]');
    const i = rowEl ? options().indexOf(rowEl) : -1;
    if (i >= 0 && i !== active) mark(i);
  });
  // A tap or click outside the field and its list closes the list; on phones the whole-screen search too.
  document.addEventListener("pointerdown", (event) => {
    const target = event.target as Element;
    if (box.contains(target) || opener?.contains(target) === true) return;
    if (isOpen() || document.body.classList.contains("search-full")) close();
  });
  opener?.addEventListener("click", focusSearch);
  document.addEventListener("keydown", (event) => {
    const focused = document.activeElement;
    const typing = focused instanceof HTMLElement && (focused.isContentEditable || focused.matches("input, textarea, select"));
    const slash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !typing;
    const command = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !event.altKey;
    if (!slash && !command) return;
    event.preventDefault();
    focusSearch();
  });
}
