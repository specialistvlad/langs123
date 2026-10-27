// The filters of the Home's search (search-filters.ts): the course chosen in its menu, the one the row starts on
// (data-start: a course index's own course, else all) until the reader chooses; the level the site's level
// choice holds (data-level on <html>); and, for the chosen course with varieties, the variety the site keeps for it.
// Each chip names its choice, the variety's menu ticking it too; a course or level that differs from the start fills
// its chip, and a tap on it returns the choice to the start. A chip's menu opens under it.
import type { Filters } from "./client-home-find.ts";
import { store } from "./client-store.ts";

export function searchFilters(changed: () => void): () => Filters {
  const root = document.documentElement;
  const row = document.getElementById("hm-filters");
  const foundCourse = row?.querySelector<HTMLElement>('[data-filter="course"]');
  const foundLevel = row?.querySelector<HTMLElement>('[data-filter="level"]');
  if (!row || !foundCourse || !foundLevel) return () => ({ course: "", upTo: "" });
  const filters: HTMLElement = row;
  const courseChip: HTMLElement = foundCourse;
  const levelChip: HTMLElement = foundLevel;
  const top = document.querySelector<HTMLElement>("#hm-f-level [data-all]")?.dataset["setLevel"] ?? "";
  const start = filters.dataset["start"] ?? "";
  let course = start;
  const level = (): string => {
    const chosen = root.dataset["level"] ?? "";
    return chosen === top ? "" : chosen;
  };

  const label = (chip: HTMLElement, text: string, on: boolean): void => {
    const span = chip.querySelector(".hm-fchip-l");
    if (span) span.textContent = text;
    chip.setAttribute("aria-pressed", String(on));
    if (on) chip.removeAttribute("popovertarget");
    else chip.setAttribute("popovertarget", chip.dataset["target"] ?? "");
  };
  function show(): void {
    const items = [...document.querySelectorAll<HTMLElement>("#hm-f-course [data-course]")];
    for (const item of items) item.setAttribute("aria-checked", String(item.dataset["course"] === course));
    const name = items.find((i) => i.dataset["course"] === course)?.dataset["name"] ?? "";
    label(courseChip, course === "" ? (courseChip.dataset["allLabel"] ?? "") : name, course !== start);
    const up = level();
    label(
      levelChip,
      up === "" ? (levelChip.dataset["allLabel"] ?? "") : (levelChip.dataset["upTo"] ?? "").replace("{level}", up),
      up !== "",
    );
    // The chosen course's variety chip shows and names the variety the site keeps for the course, else its first.
    for (const chip of filters.querySelectorAll<HTMLElement>("[data-variety-course]")) {
      const code = chip.dataset["varietyCourse"] ?? "";
      chip.hidden = code !== course;
      const menu = document.getElementById(`hm-f-variety-${code}`);
      const kept = store.get(`ln-variety-${code}`);
      const options = [...(menu?.querySelectorAll<HTMLElement>("[data-set-variety]") ?? [])];
      const chosen = options.find((i) => i.dataset["setVariety"] === kept) ?? options[0];
      for (const option of options) option.setAttribute("aria-checked", String(option === chosen));
      const shown = chip.querySelector("[data-variety-of]");
      if (shown) shown.textContent = chosen?.querySelector(".ix-title")?.textContent ?? "";
    }
    changed();
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const picked = target?.closest<HTMLElement>("#hm-f-course [data-course]");
    if (picked) course = picked.dataset["course"] ?? "";
    const pressed = target?.closest<HTMLElement>('.hm-fchip[aria-pressed="true"]');
    // A tap that clears a choice opens no menu, though the chip takes its menu back before the tap ends.
    if (pressed) event.preventDefault();
    if (pressed === courseChip) course = start;
    if (pressed === levelChip) document.querySelector<HTMLElement>("#hm-f-level [data-all]")?.click();
    if (picked || pressed || target?.closest("[data-set-variety]")) queueMicrotask(show);
  });
  new MutationObserver(show).observe(root, { attributes: true, attributeFilter: ["data-level", "data-variety"] });
  // A chip's menu opens under it, inside the window.
  for (const menu of document.querySelectorAll<HTMLElement>(".hm-fmenu")) {
    menu.addEventListener("toggle", (event) => {
      const chip = filters.querySelector<HTMLElement>(`[data-target="${menu.id}"]`);
      if (event.newState !== "open" || !chip) return;
      const at = chip.getBoundingClientRect();
      menu.style.left = `${String(Math.round(Math.min(at.left, innerWidth - menu.offsetWidth - 12)))}px`;
      menu.style.top = `${String(Math.round(at.bottom + 8))}px`;
      menu.style.maxHeight = `${String(Math.round(innerHeight - at.bottom - 28))}px`;
    });
  }
  show();
  return () => ({ course, upTo: level() });
}
