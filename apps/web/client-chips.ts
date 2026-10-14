// The chips name the reader's choices: the level filter (every level at the top one, with a dot in
// every level's colour, else "up to" the level in its colour) and the variety.
export function markChips(root: HTMLElement): void {
  const level = root.dataset["level"] ?? "";
  const top = document.querySelector<HTMLElement>("#level-panel [data-set-level]:last-child")?.dataset["setLevel"];
  document.querySelectorAll<HTMLElement>(".level-dot").forEach((dot) => {
    dot.className = level === top ? "level-dot" : `level-dot one lvl-${level}`;
  });
  document.querySelectorAll<HTMLElement>("[data-level-label]").forEach((label) => {
    label.textContent = level === top ? (label.dataset["all"] ?? "") : (label.dataset["upTo"] ?? "").replace("{level}", level);
  });
  const variety = document.querySelector(`[data-set-variety="${root.dataset["variety"] ?? ""}"]`)?.textContent;
  if (variety === undefined) return;
  document.querySelectorAll<HTMLElement>("[data-variety-label]").forEach((label) => {
    label.textContent = variety;
  });
}
