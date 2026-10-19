// A track's index (pages/track.ts): the level filter, the variety and the order are the client's own, set by a
// click on [data-set-level], [data-set-variety] or [data-set-order]; this follows their state in the menus'
// checkmarks and the order switch, and closes a menu once a choice is made.
export function trackMenus(): void {
  const root = document.documentElement;
  if (root.dataset["page"] !== "track") return;
  const sync = (): void => {
    document.querySelectorAll<HTMLElement>(".ix-item[data-set-level]").forEach((b) => {
      b.setAttribute("aria-checked", String(b.dataset["setLevel"] === root.dataset["level"]));
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
    const menu = event.target instanceof Element ? event.target.closest(".ix-item")?.closest(".ix-menu") : null;
    if (menu?.matches(":popover-open") === true) (menu as HTMLElement).hidePopover();
  });
}
