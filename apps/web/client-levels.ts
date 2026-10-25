// The level popover (level-popover.ts): a tap on a level mark fills the page's one popover from the mark's entry in
// the page's level data, before the popover opens; the rows tick the chosen level. Choosing a row sets the filter
// (client.ts) and closes the popover. On a wide screen the popover opens under its mark, on a phone from the bottom.
export interface Entry {
  t: string;
  k: "topic" | "section" | "course";
  l: Record<string, string>;
}

// Entries a page adds after it loads, as the Home's search does for the topics it lists.
const added: Record<string, Entry> = {};
export const addLevelEntries = (entries: Record<string, Entry>): void => {
  Object.assign(added, entries);
};

export function levelPopover(root: HTMLElement): void {
  const found = document.getElementById("lv-pop");
  const raw = document.getElementById("lv-data")?.textContent ?? undefined;
  if (found === null || raw === undefined) return;
  const pop: HTMLElement = found;
  const data = JSON.parse(raw) as Record<string, Entry>;
  const notes = JSON.parse(pop.dataset["notes"] ?? "{}") as Record<string, string>;
  const off = JSON.parse(pop.dataset["off"] ?? "{}") as Record<string, string>;
  const title = pop.querySelector(".lv-pop-t");
  const mark = pop.querySelector(".lv-pop-m");
  const what = pop.querySelector(".lv-pop-what");
  let opener: HTMLElement | null = null;

  const tick = (): void => {
    const top = pop.querySelector<HTMLElement>("[data-all]")?.dataset["setLevel"];
    pop.querySelectorAll<HTMLElement>(".lv-row").forEach((row) => {
      const all = row.hasAttribute("data-all");
      const on = all ? root.dataset["level"] === top : row.dataset["setLevel"] === root.dataset["level"] && root.dataset["level"] !== top;
      row.setAttribute("aria-checked", String(on));
    });
  };

  function fill(button: HTMLElement): void {
    const key = button.dataset["lv"] ?? "";
    const entry = data[key] ?? added[key];
    if (entry === undefined) return;
    if (title) title.textContent = entry.t;
    if (what) what.textContent = notes[entry.k] ?? "";
    if (mark) {
      const copy = button.cloneNode(true) as HTMLElement;
      copy.removeAttribute("popovertarget");
      copy.removeAttribute("data-lv");
      copy.setAttribute("role", "img");
      copy.setAttribute("tabindex", "-1");
      mark.replaceChildren(copy);
    }
    pop.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
      const line = entry.l[row.dataset["row"] ?? ""];
      row.classList.toggle("lv-off", line === undefined);
      const here = row.querySelector(".lv-here");
      if (here) here.textContent = line ?? off[entry.k] ?? "";
    });
    tick();
    opener = button;
  }

  // On a wide screen, under the mark, its right edge on the mark's, or its left edge where the window leaves no room
  // for that, inside the window and as tall as the window leaves
  // it, 20px from the bottom; above the mark when less than a third of the window is left below and the popover does
  // not fit there. A phone's popover sits at the bottom (level-popover.css).
  function place(): void {
    if (opener === null || !matchMedia("(min-width: 861px)").matches) {
      for (const p of ["top", "left", "max-height"]) pop.style.removeProperty(p);
      return;
    }
    const at = opener.getBoundingClientRect();
    const width = pop.offsetWidth;
    const left = Math.min(at.right - width >= 12 ? at.right - width : at.left, innerWidth - width - 12);
    const below = at.bottom + 8;
    const room = innerHeight - below - 20;
    const under = room >= Math.min(pop.scrollHeight, innerHeight / 3);
    const height = under ? room : at.top - 8 - 20;
    const top = under ? below : at.top - 8 - Math.min(pop.scrollHeight, height);
    pop.style.left = `${String(Math.round(left))}px`;
    pop.style.top = `${String(Math.round(top))}px`;
    pop.style.maxHeight = `${String(Math.round(height))}px`;
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>("[data-lv]");
      if (button !== null) fill(button);
    },
    true,
  );
  pop.addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    opener?.setAttribute("aria-expanded", String(open));
    if (open) place();
  });
  pop.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-set-level]")) {
      queueMicrotask(() => {
        tick();
        pop.hidePopover();
      });
    }
  });
}
