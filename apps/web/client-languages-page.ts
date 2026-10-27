// The Languages I know page (pages/languages.ts): puts each row where the reader's list puts it, adds, removes and
// reorders by dragging a row's handle with the pointer or with the arrow keys on it, and keeps the list in the
// browser (ln-langs). In its first-run form it keeps the list at once, and Continue goes back to the page the reader
// came from.
import { backPath, LANGS_KEY, MAX_LANGS } from "./client-languages-model.ts";
import { readerList } from "./client-languages-text.ts";
import { store } from "./client-store.ts";

export function languagesPage(main: HTMLElement): void {
  const first = main.querySelector<HTMLElement>("[data-ml-ranked]");
  const second = main.querySelector<HTMLElement>("[data-ml-others]");
  if (first === null || second === null) return;
  const [ranked, others] = [first, second];
  // The site's order, which the rows of the other languages keep.
  const all = [...main.querySelectorAll<HTMLElement>(".ml-row")].sort((a, b) => Number(a.dataset["order"]) - Number(b.dataset["order"]));
  const rows = new Map(all.map((r) => [r.dataset["lang"] ?? "", r]));
  const codes = [...rows.keys()];
  const rowsOf = (list: readonly string[]): HTMLElement[] => list.flatMap((code) => rows.get(code) ?? []);
  const lang = document.documentElement.lang;

  const current = (): string[] => [...ranked.children].map((r) => (r as HTMLElement).dataset["lang"] ?? "");
  function show(list: readonly string[]): void {
    ranked.append(...rowsOf(list));
    others.append(...rowsOf(codes.filter((code) => !list.includes(code))));
    renumber();
  }
  // Numbers, and the controls the list's size allows: at three nothing can be added, the last language stays.
  function renumber(): void {
    const list = current();
    list.forEach((code, i) => {
      const rank = rows.get(code)?.querySelector<HTMLElement>(".ml-rank");
      if (rank === null || rank === undefined) return;
      rank.textContent = String(i + 1);
      rank.classList.toggle("ml-1", i === 0);
    });
    main.classList.toggle("ml-full", list.length >= MAX_LANGS);
    for (const b of main.querySelectorAll<HTMLButtonElement>(".ml-add")) b.disabled = list.length >= MAX_LANGS;
    for (const b of main.querySelectorAll<HTMLButtonElement>(".ml-remove")) b.disabled = list.length <= 1;
    for (const b of main.querySelectorAll<HTMLButtonElement>(".ml-grip")) b.disabled = list.length <= 1;
  }
  const keep = (): void => {
    store.set(LANGS_KEY, current().join(" "));
  };

  show(readerList(codes, lang));
  if (main.dataset["first"] !== undefined) keep();

  main.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const code = target?.closest<HTMLElement>(".ml-row")?.dataset["lang"];
    const list = current();
    if (code === undefined || target === null) return;
    if (target.closest(".ml-add") && list.length < MAX_LANGS) show([...list, code]);
    else if (target.closest(".ml-remove") && list.length > 1) show(list.filter((c) => c !== code));
    else return;
    keep();
  });

  main.addEventListener("keydown", (event) => {
    const grip = event.target instanceof Element ? event.target.closest<HTMLElement>(".ml-grip") : null;
    const row = grip?.closest<HTMLElement>(".ml-row");
    if (grip === null || row === null || row === undefined) return;
    const up = event.key === "ArrowUp";
    if (!up && event.key !== "ArrowDown") return;
    event.preventDefault();
    const next = up ? row.previousElementSibling : row.nextElementSibling;
    if (next === null) return;
    if (up) next.before(row);
    else next.after(row);
    grip.focus();
    renumber();
    keep();
  });

  // Dragging: the row follows the pointer and takes the place of each neighbour the pointer passes the middle of; the
  // neighbour moves, so the handle keeps its place in the page and its pointer capture.
  main.addEventListener("pointerdown", (event) => {
    const grip = event.target instanceof Element ? event.target.closest<HTMLElement>(".ml-grip") : null;
    const row = grip?.closest<HTMLElement>(".ml-row");
    if (grip === null || row === null || row === undefined || event.button !== 0) return;
    event.preventDefault();
    grip.setPointerCapture(event.pointerId);
    let origin = event.clientY;
    row.classList.add("ml-lift");
    const move = (e: PointerEvent): void => {
      row.style.setProperty("--ml-dy", `${e.clientY - origin}px`);
      const down = row.nextElementSibling;
      const up = row.previousElementSibling;
      const below = down?.getBoundingClientRect();
      const above = up?.getBoundingClientRect();
      if (down !== null && below !== undefined && e.clientY > below.top + below.height / 2) {
        row.before(down);
        origin += below.height;
      } else if (up !== null && above !== undefined && e.clientY < above.top + above.height / 2) {
        row.after(up);
        origin -= above.height;
      } else return;
      row.style.setProperty("--ml-dy", `${e.clientY - origin}px`);
      renumber();
    };
    const end = (): void => {
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", end);
      grip.removeEventListener("pointercancel", end);
      row.classList.remove("ml-lift");
      row.style.removeProperty("--ml-dy");
      keep();
    };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  });

  // Continue: back to where the reader was, else to the Home of the first language.
  const go = main.querySelector<HTMLAnchorElement>("[data-ml-continue]");
  go?.addEventListener("click", (event) => {
    event.preventDefault();
    const home = rows.get(current()[0] ?? "")?.dataset["home"] ?? go.href;
    location.assign(backPath(new URL(location.href).searchParams.get("back")) ?? home);
  });
}
