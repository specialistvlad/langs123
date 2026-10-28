// The new library's reading in the browser (pages/reading.ts): it draws the topic again from the page's data in the reader's
// languages, the page's first and then those of Languages I know that the topic has, three at most; in the form the reader
// chose, which the browser keeps; at the reading column's width, again as it changes; and in the variety <html> names. The
// switch picks the form, a layer's control opens it under its block, Full screen opens a table whole, and a variant's tap
// switches the variety.
import { chooseVariety } from "./client-variety.ts";
import { store } from "./client-store.ts";
import { LANGS_KEY } from "./client-languages-model.ts";
import { FORM_KEY, keptForm, readerLanguages } from "./client-reading-model.ts";
import type { ReadingData } from "./pages/reading.ts";
import { Reading } from "./reading.ts";
import { article } from "./reading-layers.ts";
import { Words } from "./reading-words.ts";

function start(): void {
  const host = document.getElementById("rd");
  const raw = document.getElementById("rd-data")?.textContent;
  if (host === null || raw === undefined) return;
  const data = JSON.parse(raw) as ReadingData;
  const root = document.documentElement;
  const words = new Words(data.text, data.names, data.language);
  const languages = readerLanguages(data.language, store.get(LANGS_KEY), Object.keys(data.topic.title.text));
  let width = 0;
  const draw = (): void => {
    width = host.clientWidth;
    const variety = root.dataset["variety"] ?? data.varieties[0] ?? "all";
    const reading = new Reading(data.topic, data.source, languages, words, width, variety);
    host.innerHTML = article(reading, keptForm(store.get(FORM_KEY)));
  };
  host.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const form = target?.closest<HTMLElement>("[data-form][role=tab]");
    const more = target?.closest<HTMLButtonElement>(".rd-more");
    const full = target?.closest<HTMLElement>("[data-full]");
    const variant = target?.closest<HTMLElement>(".rd-var");
    if (form) {
      store.set(FORM_KEY, keptForm(form.dataset["form"] ?? null));
      draw();
    } else if (more) {
      const open = more.getAttribute("aria-expanded") !== "true";
      more.setAttribute("aria-expanded", String(open));
      const panel = more.nextElementSibling;
      if (panel instanceof HTMLElement) panel.hidden = !open;
    } else if (full) {
      const dialog = document.getElementById(`full-${full.dataset["full"] ?? ""}`);
      if (dialog instanceof HTMLDialogElement) dialog.showModal();
    } else if (variant) {
      const at = data.varieties.indexOf(variant.dataset["variety"] ?? "");
      const next = data.varieties[(at + 1) % data.varieties.length];
      if (next !== undefined) chooseVariety(root, next);
    }
  });
  new MutationObserver(draw).observe(root, { attributes: true, attributeFilter: ["data-variety"] });
  new ResizeObserver(() => {
    if (host.clientWidth !== width) draw();
  }).observe(host);
  draw();
}

if (typeof document !== "undefined") start();
