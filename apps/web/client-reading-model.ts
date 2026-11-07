// The reading's choices as pure rules (client-reading.ts): the reader's languages for a topic, the form the browser keeps,
// the layer files a page loads for the reader's other languages, and a layer merged into the page's topic (7.4).
import type { LayerFile, Topic } from "../../scripts/generated/export-v1.ts";
import { MAX_LANGS } from "./client-languages-model.ts";
import { type Form, FORMS } from "./reading-layers.ts";

export const FORM_KEY = "rd-form";

// The languages whose layer files a page loads: the reader's that the page did not embed.
export const layersToLoad = (languages: readonly string[], embedded: readonly string[]): string[] =>
  languages.filter((l) => !embedded.includes(l));

// A layer merged into the page's topic by id: each sentence's and item's text and span in the layer's language, each
// example's translation into it, and the language's own blocks, errors and speakers; the topic then reads as if the page
// had embedded that language.
export function mergeLayer(topic: Topic, layer: LayerFile): Topic {
  const into = (node: Record<string, unknown>, key: string, value: unknown): void => {
    const map = node[key];
    if (value !== undefined && typeof map === "object" && map !== null && !Array.isArray(map)) {
      (map as Record<string, unknown>)[layer.language] = value;
    }
  };
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const n = node as Record<string, unknown>;
    const id = n["id"];
    if (typeof id === "string") {
      into(n, "text", layer.text[id]);
      into(n, "tr", layer.tr[id]);
      into(n, "span", layer.span?.[id]);
    }
    Object.values(n).forEach(visit);
  };
  const { own, ...rest } = topic;
  visit(rest);
  return { ...rest, own: { ...own, [layer.language]: layer.own } };
}

// The reader's languages for a topic: the page's, then the kept list's that the topic has, three at most.
export function readerLanguages(page: string, kept: string | null, has: readonly string[]): string[] {
  const list = (kept ?? "").split(/[\s,]+/).filter((l) => l !== "");
  return [page, ...list.filter((l) => l !== page && has.includes(l))].slice(0, MAX_LANGS);
}

export const keptForm = (raw: string | null): Form => FORMS.find((f) => f === raw) ?? "interleaved";

// The languages whose speakers' errors the reader sees: the page's, then the kept list's, three at most.
export function readerSpeakers(page: string, kept: string | null): string[] {
  const list = (kept ?? "").split(/[\s,]+/).filter((l) => l !== "" && l !== page);
  return [page, ...list].slice(0, MAX_LANGS);
}
