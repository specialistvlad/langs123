// The theme: Auto (the system's), Light or Dark, chosen in the theme menu (toolbar.ts); the browser keeps the
// choice for the next page, which the page shell applies before first paint. The menu ticks the choice.
import { store } from "./client-store.ts";

const THEMES = ["auto", "light", "dark"];

export function themeMenu(root: HTMLElement): void {
  const apply = (name: string): void => {
    if (name === "auto") delete root.dataset["theme"];
    else root.dataset["theme"] = name;
    document.querySelectorAll<HTMLElement>("[data-set-theme]").forEach((b) => {
      b.setAttribute("aria-checked", String(b.dataset["setTheme"] === name));
    });
    // The theme named where a menu shows it, as its item reads.
    const title = document.querySelector(`[data-set-theme="${name}"] .ix-title`)?.textContent ?? "";
    document.querySelectorAll<HTMLElement>("[data-theme-now]").forEach((n) => {
      n.textContent = title;
    });
  };
  const saved = store.get("ln-theme");
  apply(saved !== null && THEMES.includes(saved) ? saved : "auto");
  document.addEventListener("click", (event) => {
    const choice = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-set-theme]") : null;
    const theme = choice?.dataset["setTheme"];
    if (choice === null || theme === undefined) return;
    apply(theme);
    store.set("ln-theme", theme);
    choice.closest<HTMLElement>("[popover]")?.hidePopover();
  });
}
