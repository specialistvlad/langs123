// The variety switch of a language being learned with varieties: <html> names the chosen variety in
// data-variety, levels.css hides the elements of the others, the browser keeps the choice per language
// (ln-variety-es) and the address carries it (?variety=es-es). The page shell applies the kept choice
// before first paint; this module follows the address and the switch's buttons.
import { store } from "./client-store.ts";

const buttons = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("[data-set-variety]")];

// The address wins over the kept choice, also where storage is off.
export function askedVariety(root: HTMLElement): void {
  const asked = (new URL(location.href).searchParams.get("variety") ?? "").toLowerCase();
  const chosen = buttons().find((b) => b.dataset["setVariety"]?.toLowerCase() === asked)?.dataset["setVariety"];
  if (chosen !== undefined) root.dataset["variety"] = chosen;
}

export function markVariety(root: HTMLElement): void {
  for (const b of buttons()) b.classList.toggle("on", b.dataset["setVariety"] === root.dataset["variety"]);
}

export function chooseVariety(root: HTMLElement, value: string): void {
  root.dataset["variety"] = value;
  store.set(`ln-variety-${value.split("-")[0] ?? ""}`, value);
}
