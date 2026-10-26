// The items of the split view (split.ts has the contract): on a wide screen a plain click on an item link fetches the
// target page, takes its fragment into the right pane and pushes "?open=<item path>", so Back and reload show the item
// chosen; a close link, Back and a reload that names no item bring the pane's own content back.
import { addLevelEntries, type Entry } from "./client-levels.ts";
import { store } from "./client-store.ts";

const wide = (): boolean => matchMedia("(min-width: 861px)").matches;

interface Where {
  body?: string;
  tools?: string;
  extras?: string;
}
interface Fragment {
  body: Node;
  tools: Node[];
  entries: Record<string, Entry>;
  varieties: string[];
  variety: string;
  page: string;
}

// The address of a page showing the item at `path` (none: the pane's own content).
function address(path: string | null): string {
  const url = new URL(location.href);
  url.searchParams.delete("open");
  const rest = url.searchParams.toString();
  const query = [rest, path === null ? "" : `open=${path}`].filter((part) => part !== "").join("&");
  return `${url.pathname}${query === "" ? "" : `?${query}`}${url.hash}`;
}

// What a target page gives: its declared fragment, tools and extras, else where the link's `data-sp-from` says.
async function fetchFragment(link: HTMLAnchorElement): Promise<Fragment | null> {
  const response = await fetch(link.href);
  if (!response.ok) return null;
  const doc = new DOMParser().parseFromString(await response.text(), "text/html");
  const from = JSON.parse(link.closest<HTMLElement>("[data-sp-from]")?.dataset["spFrom"] ?? "{}") as Where;
  // What the page declares, else where the link says.
  const all = (declared: string, named: string | undefined): Element[] => {
    const found = [...doc.querySelectorAll(declared)];
    return found.length > 0 || named === undefined ? found : [...doc.querySelectorAll(named)];
  };
  const [found] = all("[data-sp-fragment]", from.body);
  if (found === undefined) return null;
  const body = document.importNode(found, true);
  body.removeAttribute("id");
  const tools = [...all("[data-sp-tools]", from.tools), ...all("[data-sp-extras]", from.extras)];
  const data = doc.getElementById("lv-data")?.textContent ?? undefined;
  const html = doc.documentElement.dataset;
  return {
    body,
    tools: tools.map((el) => document.importNode(el, true)),
    entries: data === undefined ? {} : (JSON.parse(data) as Record<string, Entry>),
    varieties: (html["varieties"] ?? "").split(" ").filter((v) => v !== ""),
    variety: html["variety"] ?? "",
    page: html["page"] ?? "",
  };
}

// The varieties of a page and the one chosen: the pane's course shows its own (the reader's choice for its language,
// else the default); a page without any shows its own.
interface Varieties {
  list: string[];
  variety: string;
}
const varietiesOf = (root: HTMLElement): Varieties => ({
  list: (root.dataset["varieties"] ?? "").split(" ").filter((v) => v !== ""),
  variety: root.dataset["variety"] ?? "",
});
function chosen(list: string[], first: string): Varieties {
  const kept = (store.get(`ln-variety-${list[0]?.split("-")[0] ?? ""}`) ?? "").toLowerCase();
  return { list, variety: list.find((v) => v.toLowerCase() === kept) ?? first };
}
function setVarieties(root: HTMLElement, v: Varieties): void {
  if (v.list.length === 0) {
    delete root.dataset["varieties"];
    delete root.dataset["variety"];
  } else {
    root.dataset["varieties"] = v.list.join(" ");
    root.dataset["variety"] = v.variety;
  }
}

export function openItems(sp: HTMLElement): void {
  const left = sp.querySelector<HTMLElement>(".sp-left");
  const right = sp.querySelector<HTMLElement>(".sp-right");
  const tools = sp.querySelector<HTMLElement>(".sp-tools");
  const body = sp.querySelector<HTMLElement>(".sp-body");
  if (left === null || right === null || tools === null || body === null) return;
  const root = document.documentElement;
  // The pane's own content, which a close brings back.
  const own = { tools: [...tools.childNodes], body: [...body.childNodes], open: sp.dataset["spOpen"], varieties: varietiesOf(root) };
  let shown: string | null = null;
  let turn = 0;
  const links = (): HTMLAnchorElement[] => [...left.querySelectorAll<HTMLAnchorElement>("a[data-sp-item]")];

  // The links of the fragment below the item's path lead to the item's page with that path chosen.
  function lead(link: HTMLAnchorElement): void {
    for (const a of body?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []) {
      if (a.origin === location.origin && a.pathname.startsWith(link.pathname) && a.pathname !== link.pathname) {
        a.href = `${link.pathname}?open=${a.pathname}${a.hash}`;
      }
    }
  }
  function choose(link: HTMLAnchorElement | null): void {
    for (const el of left?.querySelectorAll("[data-sp-chosen]") ?? []) el.removeAttribute("data-sp-chosen");
    for (const el of left?.querySelectorAll("[aria-current]") ?? []) el.removeAttribute("aria-current");
    link?.setAttribute("aria-current", "true");
    link?.setAttribute("data-sp-chosen", "");
    link?.closest("[data-sp-unit]")?.setAttribute("data-sp-chosen", "");
  }

  async function show(path: string | null, push: boolean): Promise<void> {
    const mine = ++turn;
    const link = path === null ? null : (links().find((a) => a.pathname === path) ?? null);
    const fragment = link === null ? null : await fetchFragment(link).catch(() => null);
    if (mine !== turn) return;
    sp.removeAttribute("data-sp-pending");
    if (link !== null && fragment === null) {
      if (push) location.assign(link.href);
      return;
    }
    if (push) history.pushState(null, "", address(path));
    shown = path;
    choose(link);
    if (link === null || fragment === null) {
      tools?.replaceChildren(...own.tools);
      body?.replaceChildren(...own.body);
      if (own.open === undefined) sp.removeAttribute("data-sp-open");
      else sp.setAttribute("data-sp-open", own.open);
      setVarieties(root, own.varieties);
      delete root.dataset["spPage"];
    } else {
      tools?.replaceChildren(...fragment.tools);
      body?.replaceChildren(fragment.body);
      sp.setAttribute("data-sp-open", link.pathname);
      root.dataset["spPage"] = fragment.page;
      addLevelEntries(fragment.entries);
      setVarieties(root, fragment.varieties.length > 0 ? chosen(fragment.varieties, fragment.variety) : own.varieties);
      lead(link);
    }
    right?.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("sp:shown"));
  }

  sp.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-sp-item]") : null;
    if (link === null || !wide() || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.pathname !== shown) void show(link.pathname, true);
  });
  // A close link closes what an item opened; where the page itself shows the item, it navigates.
  right.addEventListener("click", (event) => {
    if (shown === null || !(event.target instanceof Element) || event.target.closest("[data-sp-close]") === null) return;
    event.preventDefault();
    void show(null, true);
  });

  const asked = (): string | null => new URL(location.href).searchParams.get("open");
  addEventListener("popstate", () => {
    const path = asked();
    void show(path !== null && links().some((a) => a.pathname === path) ? path : null, false);
  });
  const first = asked();
  if (first !== null && links().some((a) => a.pathname === first)) void show(first, false);
  else sp.removeAttribute("data-sp-pending");
}
