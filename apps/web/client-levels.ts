// The level popover (level-popover.ts): a tap on a level mark fills the page's one popover from the mark's entry in
// the page's level data (its name) and from the levels the mark lights, before the popover opens. The head shows the
// name, the bars and the range as a pill; a level the mark lacks below the top one dims and cannot be chosen, the top
// one (All levels) staying active; the rows tick the chosen level, the top one while none is chosen. Choosing a row sets the filter (client.ts) and closes the
// popover. On a wide screen the popover opens under its mark, on a phone it rises from the bottom as a sheet. The
// toolbar's Level button opens it for the course (data-lv-levels names the levels the course holds, data-lv-under the
// toolbar's group it opens under).
export interface Entry {
  t: string;
}

// Entries a page adds after it loads, as the Home's search does for the topics it lists.
const added: Record<string, Entry> = {};
export const addLevelEntries = (entries: Record<string, Entry>): void => {
  Object.assign(added, entries);
};

// The range as a level pill: one level, or two joined halves with a hidden dash between.
function rangePill(from: string, to: string): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "badge lvl";
  badge.dataset["from"] = from;
  badge.dataset["to"] = to;
  const half = (level: string): HTMLElement => {
    const part = document.createElement("span");
    part.className = `half lvl-${level}`;
    part.textContent = level;
    return part;
  };
  if (from === to) {
    badge.append(half(from));
  } else {
    const dash = document.createElement("span");
    dash.className = "sr-only";
    dash.textContent = "–";
    badge.append(half(from), dash, half(to));
  }
  return badge;
}

export function levelPopover(root: HTMLElement): void {
  const found = document.getElementById("lv-pop");
  const raw = document.getElementById("lv-data")?.textContent ?? undefined;
  if (found === null || raw === undefined) return;
  const pop: HTMLElement = found;
  const data = JSON.parse(raw) as Record<string, Entry>;
  const title = pop.querySelector(".lv-pop-t");
  const range = pop.querySelector(".lv-pop-r");
  const rows = [...pop.querySelectorAll<HTMLElement>(".lv-row")];
  const scale = rows.map((row) => row.dataset["row"] ?? "");
  const all = scale.at(-1);
  let opener: HTMLElement | null = null;

  // With no level chosen the top row is ticked.
  const tick = (): void => {
    const level = root.dataset["level"] ?? "";
    const chosen = level === "" ? all : level;
    rows.forEach((row) => {
      row.setAttribute("aria-checked", String(row.dataset["row"] === chosen));
    });
  };

  function fill(button: HTMLElement): void {
    const entry = data[button.dataset["lv"] ?? ""] ?? added[button.dataset["lv"] ?? ""];
    if (entry === undefined) return;
    // A button that names its levels (data-lv-levels, the course's) holds them; a mark holds the levels it lights.
    const named = button.dataset["lvLevels"];
    const lit =
      named === undefined
        ? [...button.querySelectorAll("i.on")].flatMap((bar) =>
            [...bar.classList].filter((c) => c.startsWith("lv-")).map((c) => c.slice(3)),
          )
        : named.split(" ");
    const held = scale.filter((level) => lit.includes(level));
    if (title) title.textContent = entry.t;
    pop.querySelectorAll<HTMLElement>(".lv-pop-m i").forEach((bar, at) => {
      bar.classList.toggle("on", held.includes(scale[at] ?? ""));
    });
    const [from, to] = [held[0], held.at(-1)];
    range?.replaceChildren(...(from === undefined || to === undefined ? [] : [rangePill(from, to)]));
    rows.forEach((row) => {
      const level = row.dataset["row"] ?? "";
      // The top row stands for every level, so it stays active on an element that stops below it.
      const has = held.includes(level) || level === all;
      row.classList.toggle("lv-off", !has);
      row.setAttribute("aria-disabled", String(!has));
      if (has) row.setAttribute("data-set-level", level);
      else row.removeAttribute("data-set-level");
    });
    tick();
    opener = button;
  }

  // On a wide screen, under the mark, its right edge on the mark's, or its left edge where the window leaves no room
  // for that, inside the window and as tall as the window leaves it, 20px from the bottom; above the mark when less
  // than a third of the window is left below and the popover does not fit there. A phone's popover is a sheet at the
  // bottom (level-mark.css).
  function place(): void {
    if (opener === null || !matchMedia("(min-width: 861px)").matches) {
      for (const p of ["top", "left", "max-height"]) pop.style.removeProperty(p);
      return;
    }
    // A button naming a group it sits in (data-lv-under) opens under the group, on the group's right edge.
    const group = opener.dataset["lvUnder"];
    const at = (group === undefined ? opener : (opener.closest(group) ?? opener)).getBoundingClientRect();
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
