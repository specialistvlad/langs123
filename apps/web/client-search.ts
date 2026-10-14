// The sidebar's search: the field shows once this script runs, and typing keeps the entries of the index
// whose names hold what was typed, accents and case aside; a heading stays while an entry under it
// does. "/" anywhere outside a field moves to the search.
const fold = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function searchIndex(): void {
  const field = document.querySelector<HTMLElement>(".nav-search");
  const input = field?.querySelector("input");
  if (!field || !input) return;
  field.hidden = false;
  const lists = [...document.querySelectorAll<HTMLElement>(".sidebar .nav-list")];
  input.addEventListener("input", () => {
    const asked = fold(input.value.trim());
    for (const list of lists) {
      let heading: Element | null = null;
      let headingKept = false;
      const close = (): void => {
        heading?.classList.toggle("no-match", !headingKept);
      };
      for (const el of list.children) {
        if (el.tagName === "H4") {
          close();
          heading = el;
          headingKept = false;
          continue;
        }
        const kept = asked === "" || fold(el.textContent).includes(asked);
        el.classList.toggle("no-match", !kept);
        if (kept) headingKept = true;
      }
      close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && (active.isContentEditable || active.matches("input, textarea, select"))) return;
    event.preventDefault();
    if (matchMedia("(max-width: 860px)").matches) document.body.classList.add("nav-open");
    input.focus();
  });
}
