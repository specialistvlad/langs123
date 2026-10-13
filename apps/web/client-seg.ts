// Switches on small screens (below 860 px, media.css): each shows its current choice alone; tapping it
// opens the switch to every choice, and choosing one, or tapping elsewhere, closes it again. The language
// switch works so at every width, as a details element that a tap elsewhere or Escape closes.
const compact = matchMedia("(max-width: 860px)");

export function collapsibleSwitches(): void {
  // Capture runs before client.ts acts on the choice, so the tap that opens a switch chooses nothing.
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const seg = target.closest(".seg");
      document.querySelectorAll(".seg.open").forEach((s) => {
        if (s !== seg) s.classList.remove("open");
      });
      // The language switch opens and closes by itself (a details element); a tap elsewhere closes it.
      document.querySelectorAll("details.lang-menu[open]").forEach((d) => {
        if (d !== seg) d.removeAttribute("open");
      });
      if (seg?.matches("details.lang-menu") === true) return;
      if (seg === null || !compact.matches) return;
      if (seg.classList.contains("open")) {
        seg.classList.remove("open");
        return;
      }
      if (target.closest(".seg > .on") === null) return;
      seg.classList.add("open");
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll("details.lang-menu[open]").forEach((d) => {
      d.removeAttribute("open");
    });
  });
}
