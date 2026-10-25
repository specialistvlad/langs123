// What every Read in menu holds: the note on what the language is for, then each explanation language by its own
// name with its name in the language the page is read in under it, the one read in ticked.
import type { Choice } from "./context.ts";
import { escapeHtml } from "./html.ts";
import { TICK } from "./track-parts.ts";
import type { Ui } from "./ui.ts";

export const readItems = (t: Ui, choices: Choice[]): string =>
  `<p class="ix-hint">${escapeHtml(t.readNote)}</p>${choices
    .map(
      (c) =>
        `<a href="${c.href}" hreflang="${c.lang}" data-read="${c.lang}" role="menuitemradio" class="ix-item" aria-checked="${String(c.on)}"><span class="ix-tick" aria-hidden="true">${TICK}</span><span class="ix-text"><span class="ix-title">${escapeHtml(c.label)}</span>${c.sub === "" ? "" : `<span class="ix-sub">${escapeHtml(c.sub)}</span>`}</span></a>`,
    )
    .join("")}`;
