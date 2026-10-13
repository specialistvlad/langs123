// The home page's matrix: a cell under the pointer or the keyboard lights up its column, as CSS lights up
// its row (static-pages.css).
export function matrixColumns(): void {
  for (const table of document.querySelectorAll<HTMLTableElement>("table.matrix")) {
    const light = (target: EventTarget | null, on: boolean): void => {
      const cell = target instanceof Element ? target.closest("td") : null;
      if (cell === null) return;
      for (const row of table.rows) row.cells[cell.cellIndex]?.classList.toggle("col-on", on);
    };
    table.addEventListener("mouseover", (event) => {
      light(event.target, true);
    });
    table.addEventListener("mouseout", (event) => {
      light(event.target, false);
    });
    table.addEventListener("focusin", (event) => {
      light(event.target, true);
    });
    table.addEventListener("focusout", (event) => {
      light(event.target, false);
    });
  }
}
