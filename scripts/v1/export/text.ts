// A topic's text as the export carries it: each sentence with its source text and its translation in each language
// that has one, a split as its list, a join on its first sentence with the number it spans; each example with its
// course text and its translations; each language's own text in that language alone. Text keeps its marks.
import type { Example, Sentence } from "../../generated/export-v1.ts";
import type { Example as SourceExample, Sentence as SourceSentence, TopicLanguageFile } from "../../generated/library-v1.ts";

type Translation = string | string[];

export interface Layer {
  language: string;
  // Each source id with its translation, and how many sentences it spans where it joins them.
  text: Map<string, { text: Translation; span?: number }>;
}

// A language file's translations by source id: a join sits on its first id, the ids after it hold none.
export function layerOf(file: TopicLanguageFile): Layer {
  const text = new Map<string, { text: Translation; span?: number }>();
  for (const [key, value] of Object.entries(file.text)) {
    const [first = key, ...rest] = key.split(" + ");
    text.set(first, rest.length === 0 ? { text: value } : { text: value, span: rest.length + 1 });
  }
  return { language: file.language, text };
}

export class Texts {
  constructor(
    private readonly source: string,
    private readonly course: string,
    private readonly layers: Layer[],
  ) {}

  sentence(s: SourceSentence): Sentence {
    const text: Sentence["text"] = { [this.source]: s.text };
    const span: Record<string, number> = {};
    for (const layer of this.layers) {
      const t = layer.text.get(s.id);
      if (t === undefined) continue;
      text[layer.language] = t.text;
      if (t.span !== undefined) span[layer.language] = t.span;
    }
    return { id: s.id, text, ...(Object.keys(span).length > 0 && { span }) };
  }

  // An example's translations, in every language but the course's own, where it stands alone (FT-07).
  example(e: SourceExample): Example {
    const tr: Example["tr"] = {};
    for (const layer of this.layers) {
      const t = layer.text.get(e.id);
      if (t !== undefined && layer.language !== this.course) tr[layer.language] = t.text;
    }
    return { id: e.id, text: e.text, tr, ...(e.variety !== undefined && { variety: e.variety }) };
  }

  // A text the source holds by an id of its own, such as an item's gloss.
  of(id: string, text: string): Sentence["text"] {
    return this.sentence({ id, text }).text;
  }
}
