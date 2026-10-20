// The chips name the reader's choices: the level filter (All levels at the top one, else the chosen level's bar lit
// and its name, also in the notes of empty sections) and the variety.
export function markChips(root: HTMLElement): void {
  const level = root.dataset["level"] ?? "";
  const top = document.querySelector<HTMLElement>("[data-set-level][data-all]")?.dataset["setLevel"];
  const all = level === top || level === "";
  document.querySelectorAll<HTMLElement>(".lvm-one").forEach((mark) => {
    mark.hidden = all;
    mark.querySelectorAll("i").forEach((bar) => {
      bar.classList.toggle("on", bar.classList.contains(`lv-${level}`));
    });
  });
  document.querySelectorAll<HTMLElement>("[data-level-now]").forEach((name) => {
    name.textContent = level;
  });
  document.querySelectorAll<HTMLElement>("[data-level-label]").forEach((label) => {
    const names = JSON.parse(label.dataset["names"] ?? "{}") as Record<string, string>;
    label.textContent = all ? (label.dataset["all"] ?? "") : (names[level] ?? level);
  });
  const variety = document.querySelector(`[data-set-variety="${root.dataset["variety"] ?? ""}"]`)?.textContent;
  if (variety === undefined) return;
  document.querySelectorAll<HTMLElement>("[data-variety-label]").forEach((label) => {
    label.textContent = variety;
  });
}
