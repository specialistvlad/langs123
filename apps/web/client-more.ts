// More on a phone's Home (toolbar.ts moreMenu): Read in and the theme open their lists in its place and the way back
// returns to the three; it opens on the three, and its button shows pressed while it is open.
export function moreMenu(): void {
  const menu = document.getElementById("hm-more");
  const button = document.querySelector<HTMLElement>('[popovertarget="hm-more"]');
  if (!menu || !button) return;
  const show = (panel: string): void => {
    menu.querySelectorAll<HTMLElement>("[data-panel]").forEach((p) => {
      p.hidden = p.dataset["panel"] !== panel;
    });
  };
  menu.addEventListener("click", (event) => {
    const panel = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-more]")?.dataset["more"] : undefined;
    if (panel !== undefined) show(panel);
  });
  menu.addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    button.setAttribute("aria-expanded", String(open));
    if (!open) show("main");
  });
}
