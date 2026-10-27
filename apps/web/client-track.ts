// The menus of a course index (pages/track.ts) and a topic page (pages/topic.ts), and the More menu: the level filter, the
// variety and the grouping are the client's own, set by a click on [data-set-level], [data-set-variety] or
// [data-set-order]; this follows their state in the menus' checkmarks (All levels at the top level, a level below it;
// Categories or By level) and closes a menu once a choice is made; an item of More that opens one of its lists or goes
// back (client-more.ts) keeps it open. On a topic page the topics column opens with the topic being read in view.
export function trackMenus(): void {
  const root = document.documentElement;
  if (document.querySelector(".ix-menu") === null) return;
  const top = document.querySelector<HTMLElement>(".ix-item[data-all]")?.dataset["setLevel"];
  const sync = (): void => {
    const level = root.dataset["level"];
    document.querySelectorAll<HTMLElement>(".ix-item[data-set-level]").forEach((b) => {
      const on = b.hasAttribute("data-all") ? level === top : b.dataset["setLevel"] === level && level !== top;
      b.setAttribute("aria-checked", String(on));
    });
    document.querySelectorAll<HTMLElement>(".ix-item[data-set-variety]").forEach((b) => {
      b.setAttribute("aria-checked", String(b.dataset["setVariety"] === root.dataset["variety"]));
    });
    const order = root.dataset["order"] === "path" ? "path" : "categories";
    document.querySelectorAll<HTMLElement>(".ix-item[data-set-order]").forEach((b) => {
      b.setAttribute("aria-checked", String(b.dataset["setOrder"] === order));
    });
  };
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-level", "data-variety", "data-order"] });
  sync();
  document.addEventListener("click", (event) => {
    const menu = event.target instanceof Element ? event.target.closest(".ix-item:not([data-more])")?.closest(".ix-menu") : null;
    if (menu?.matches(":popover-open") === true) (menu as HTMLElement).hidePopover();
  });
  // A button whose menu is open shows pressed.
  document.addEventListener(
    "toggle",
    (event) => {
      if (!(event.target instanceof HTMLElement) || !event.target.matches(".ix-menu")) return;
      const open = event.newState === "open";
      document.querySelectorAll(`.ix-btn[popovertarget="${event.target.id}"]`).forEach((b) => {
        b.setAttribute("aria-expanded", String(open));
      });
    },
    true,
  );
  showCurrent();
}

// The topic being read, marked in the column, comes into view in it with its section's heading at the column's top:
// the column scrolls, not the page.
function showCurrent(): void {
  const side = document.querySelector<HTMLElement>("[data-cl-side]");
  if (!side?.querySelector("li[data-current]")) return;
  const place = (): void => {
    const shown = [...side.querySelectorAll<HTMLElement>("li[data-current]")].find((li) => li.offsetHeight > 0);
    if (shown === undefined) return;
    const at = shown.getBoundingClientRect();
    const top = side.querySelector(".cl-top")?.getBoundingClientRect().bottom ?? side.getBoundingClientRect().top;
    const bottom = side.getBoundingClientRect().bottom;
    const section = (shown.closest("section") ?? shown).getBoundingClientRect();
    if (at.top < top || at.bottom > bottom) side.scrollTop += section.top - top;
  };
  place();
  new MutationObserver(place).observe(document.documentElement, { attributes: true, attributeFilter: ["data-order"] });
}
