// The theme: automatic (the system's), light or dark; each tap on a theme button moves to the next,
// and the browser keeps the choice for the next page, which the page shell applies before first paint.
import { store } from "./client-store.ts";

const THEMES = ["auto", "light", "dark"];

export function themeToggle(root: HTMLElement): void {
  const apply = (name: string): void => {
    if (name === "auto") delete root.dataset["theme"];
    else root.dataset["theme"] = name;
  };
  const saved = store.get("ln-theme");
  let theme = saved !== null && saved !== "" ? saved : "auto";
  apply(theme);
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || event.target.closest("[data-theme-toggle]") === null) return;
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? "auto";
    apply(theme);
    store.set("ln-theme", theme);
  });
}
