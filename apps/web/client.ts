// Progressive enhancement for the static pages: level filter, variety, view, order, the chips and their panels, the top bar's search, closing menus, hiding top bar, study-path step, theme, menu, sidebar scroll, on-this-page highlight, study-path links, lanes, live reload.
// The build bundles it with its modules into client.js for the browser.
import { closingMenu, hidingBar } from "./client-bar.ts";
import { liveReload } from "./client-dev.ts";
import { homeSearch } from "./client-home.ts";
import { trackMenus } from "./client-track.ts";
import { markChips } from "./client-chips.ts";
import { closePanel, panels } from "./client-panel.ts";
import { stepLinks, studyStep } from "./client-path.ts";
import { topSearch } from "./client-search.ts";
import { themeToggle } from "./client-theme.ts";
import { closingMenus } from "./client-seg.ts";
import { store } from "./client-store.ts";
import { askedVariety, chooseVariety, markVariety } from "./client-variety.ts";

(() => {
  "use strict";
  const root = document.documentElement;

  // Start-up fills in the level and view, so the buttons only follow them.
  function mark(): void {
    document.querySelectorAll<HTMLElement>("[data-set-level]").forEach((b) => {
      b.classList.toggle("on", b.dataset["setLevel"] === root.dataset["level"]);
    });
    document.querySelectorAll<HTMLElement>("[data-set-view]").forEach((b) => {
      b.classList.toggle("on", b.dataset["setView"] === root.dataset["view"]);
    });
    document.querySelectorAll<HTMLElement>("[data-set-order]").forEach((b) => {
      b.classList.toggle("on", b.dataset["setOrder"] === root.dataset["order"]);
    });
    markVariety(root);
    markChips(root);
  }

  const step = studyStep(root);
  stepLinks();
  closingMenus();
  panels();
  topSearch();
  homeSearch();
  trackMenus();
  hidingBar();
  closingMenu();

  themeToggle(root);

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const level = target.closest<HTMLElement>("[data-set-level]")?.dataset["setLevel"];
    if (level !== undefined) {
      choose("level", level);
      closePanel(target);
    }
    const view = target.closest<HTMLElement>("[data-set-view]")?.dataset["setView"];
    if (view !== undefined) choose("view", view);
    const order = target.closest<HTMLElement>("[data-set-order]")?.dataset["setOrder"];
    if (order !== undefined) choose("order", order);
    const variety = target.closest<HTMLElement>("[data-set-variety]")?.dataset["setVariety"];
    if (variety !== undefined) {
      chooseVariety(root, variety);
      showState();
      refresh();
      closePanel(target);
    }
    if (target.closest("[data-print]")) window.print();
    if (target.closest("#menu")) document.body.classList.toggle("nav-open");
  });

  // A page carries the choice of each switch it has in its address, ?level=a1, ?variety=es-es and
  // ?view=cheatsheet, so a shared link opens the same state.
  function showState(): void {
    const url = new URL(location.href);
    const level = root.dataset["level"];
    if (filled(level) && document.querySelector("[data-set-level]")) url.searchParams.set("level", level.toLowerCase());
    const variety = root.dataset["variety"];
    if (filled(variety) && document.querySelector("[data-set-variety]")) url.searchParams.set("variety", variety.toLowerCase());
    if (document.querySelector("[data-set-view]")) url.searchParams.set("view", root.dataset["view"] ?? "extended");
    if (url.href !== location.href) history.replaceState(history.state, "", url);
  }
  const filled = (value: string | undefined): value is string => value !== undefined && value !== "";

  // A switch's choice: the page shows it, the browser keeps it for the next page, the address carries it.
  function choose(name: "level" | "view" | "order", value: string): void {
    root.dataset[name] = value;
    store.set(`ln-${name}`, value);
    showState();
    refresh();
  }

  function refresh(): void {
    mark();
    step();
    lanes();
    spy();
  }

  // The address wins over the stored choices, also where storage is off.
  const params = new URL(location.href).searchParams;
  const askedLevel = (params.get("level") ?? "").toUpperCase();
  if (document.querySelector(`[data-set-level="${askedLevel}"]`)) root.dataset["level"] = askedLevel;
  askedVariety(root);
  const askedView = params.get("view");
  if (askedView === "cheatsheet" || askedView === "extended") root.dataset["view"] = askedView;
  if (!filled(root.dataset["view"])) root.dataset["view"] = "extended";
  if (!filled(root.dataset["level"])) {
    root.dataset["level"] = document.querySelector<HTMLElement>("#level-panel [data-set-level]:last-child")?.dataset["setLevel"] ?? "";
  }
  if (root.dataset["order"] !== "path") root.dataset["order"] = "categories";
  showState();
  mark();
  step();

  // On this page: highlights the section being read, the lowest section top above 30% of the window
  // (or the first section on screen before any reaches that line).
  const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>(".toc a[href^='#']")];
  const tocParts = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
  let spyFrame = 0;
  function spy(): void {
    spyFrame = 0;
    const line = innerHeight * 0.3;
    let current = -1;
    let currentTop = -Infinity;
    let first = -1;
    let firstTop = Infinity;
    tocParts.forEach((part, i) => {
      if (part === null || part.offsetHeight === 0) return;
      const top = part.getBoundingClientRect().top;
      if (top <= line && top > currentTop) [current, currentTop] = [i, top];
      if (top < firstTop) [first, firstTop] = [i, top];
    });
    if (current < 0) current = first;
    tocLinks.forEach((a, i) => {
      a.classList.toggle("on", i === current);
    });
  }
  const scheduleSpy = (): void => {
    if (spyFrame === 0) spyFrame = requestAnimationFrame(spy);
  };
  if (tocLinks.length > 0) {
    addEventListener("scroll", scheduleSpy, { passive: true });
    addEventListener("resize", scheduleSpy);
    spy();
  }

  // Sidebar scroll position for the next page; the page shell restores it.
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    addEventListener("pagehide", () => {
      try {
        sessionStorage.setItem("ln-nav", JSON.stringify({ k: sidebar.dataset["key"], t: sidebar.scrollTop }));
      } catch {
        // Storage is off: the next page opens its menu at the top.
      }
    });
  }

  // Lanes without grid-lanes: CSS sets the column count, this places each visible block, in order,
  // at the top of the shortest column on a grid of 4px rows.
  const fallback = CSS.supports("display", "grid-lanes") ? [] : [...document.querySelectorAll<HTMLElement>(".lanes")];
  function lanes(): void {
    for (const el of fallback) {
      const style = getComputedStyle(el);
      const count = style.gridTemplateColumns.split(" ").length;
      const gapValue = parseFloat(style.getPropertyValue("--lane-gap"));
      const gap = Number.isNaN(gapValue) ? 0 : gapValue;
      el.classList.toggle("js-lanes", count > 1);
      const heights = new Array<number>(count).fill(0);
      for (const item of el.children) {
        if (!(item instanceof HTMLElement)) continue;
        item.style.gridColumn = "";
        item.style.gridRow = "";
        if (count === 1 || item.offsetHeight === 0) continue;
        const margins = parseFloat(getComputedStyle(item).marginTop) + parseFloat(getComputedStyle(item).marginBottom);
        const span = Math.ceil((item.offsetHeight + margins + gap) / 4);
        const lane = heights.indexOf(Math.min(...heights));
        const height = heights[lane] ?? 0;
        item.style.gridColumn = String(lane + 1);
        item.style.gridRow = `${height + 1} / span ${span}`;
        heights[lane] = height + span;
      }
    }
    delete root.dataset["lanes"];
  }
  const widths = new Map<Element, number>();
  const observer = new ResizeObserver((entries) => {
    if (entries.every((e) => widths.get(e.target) === e.target.clientWidth)) return;
    for (const e of entries) widths.set(e.target, e.target.clientWidth);
    lanes();
  });
  fallback.forEach((el) => {
    observer.observe(el);
  });
  if (fallback.length > 0) void document.fonts.ready.then(lanes);

  if (root.dataset["dev"] === "1") liveReload();
})();
