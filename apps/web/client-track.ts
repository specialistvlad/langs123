// The menus of a track's index (pages/track.ts) and a topic page (pages/topic.ts), and the Home's theme menu: the
// level filter, the variety and the order are the client's own, set by a click on [data-set-level],
// [data-set-variety] or [data-set-order]; this follows their state in the menus' checkmarks (All levels at the top
// level, a level below it) and the order switch, and closes a menu once a choice is made; an item of More that opens
// one of its lists or goes back (client-more.ts) keeps it open.
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
    document.querySelectorAll<HTMLElement>(".ix-seg [data-set-order]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset["setOrder"] === order));
    });
  };
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-level", "data-variety", "data-order"] });
  sync();
  document.addEventListener("click", (event) => {
    const menu = event.target instanceof Element ? event.target.closest(".ix-item:not([data-more])")?.closest(".ix-menu") : null;
    if (menu?.matches(":popover-open") === true) (menu as HTMLElement).hidePopover();
  });
}
