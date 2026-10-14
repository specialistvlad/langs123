// The panels the chips and the bottom bar open (popovers, so they open and close without this script,
// and Escape or a tap outside closes them): on wide screens a panel opens under the chip that opened it;
// on phones it stays a sheet along the bottom (panels.css). A choice made in a panel closes it.
const wide = matchMedia("(min-width: 861px)");

export function panels(): void {
  let opener: Element | null = null;
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (target instanceof Element) opener = target.closest("[popovertarget]") ?? opener;
    },
    true,
  );
  for (const panel of document.querySelectorAll<HTMLElement>(".panel[popover]")) {
    panel.addEventListener("toggle", (event) => {
      if (event.newState !== "open") return;
      panel.style.removeProperty("top");
      panel.style.removeProperty("left");
      if (!wide.matches || opener === null) return;
      const at = opener.getBoundingClientRect();
      const left = Math.min(at.left, innerWidth - panel.offsetWidth - 8);
      panel.style.top = `${String(at.bottom + 6)}px`;
      panel.style.left = `${String(Math.max(8, left))}px`;
    });
  }
}

export function closePanel(target: Element): void {
  const panel = target.closest<HTMLElement>(".panel[popover]");
  if (panel?.matches(":popover-open") === true) panel.hidePopover();
}
