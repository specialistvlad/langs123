// Read in: the reader's choice of language is kept (ln-read), so a first visit no longer leads to the browser's
// language (pages/home.ts).
import { store } from "./client-store.ts";

export function readChoice(): void {
  document.addEventListener("click", (event) => {
    const lang = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-read]")?.dataset["read"] : undefined;
    if (lang !== undefined) store.set("ln-read", lang);
  });
}
