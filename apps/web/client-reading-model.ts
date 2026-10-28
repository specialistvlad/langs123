// The reading's choices as pure rules (client-reading.ts): the reader's languages for a topic and the form the browser keeps.
import { MAX_LANGS } from "./client-languages-model.ts";
import { type Form, FORMS } from "./reading-layers.ts";

export const FORM_KEY = "rd-form";

// The reader's languages for a topic: the page's, then the kept list's that the topic has, three at most.
export function readerLanguages(page: string, kept: string | null, has: readonly string[]): string[] {
  const list = (kept ?? "").split(/[\s,]+/).filter((l) => l !== "");
  return [page, ...list.filter((l) => l !== page && has.includes(l))].slice(0, MAX_LANGS);
}

export const keptForm = (raw: string | null): Form => FORMS.find((f) => f === raw) ?? "interleaved";
