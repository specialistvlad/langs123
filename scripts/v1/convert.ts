// Converts the samples of library/samples from their plain shape (samples/README.md) to the new library's schema, as
// the M4 schema study says: an item's letter, small form and word become its form and its name its ipa; a table's
// axes name the rows and the columns with the features' own names, its columns take their axis' values as keys and
// its rows hold their cells under cells; a cell's form of one variety becomes { form, variety }; a form drops the
// term marks around its words; a topic leaves its course and source to its course's index, which the conversion
// writes from the topics' titles and levels; and each language file records its fingerprints.
type Node = Record<string, unknown>;

const AXES: Record<string, string> = { persona: "person", número: "number" };
const VALUES: Record<string, string> = { singular: "sg", plural: "pl" };
const LONE_VARIANT = /^\{variant ([a-z]{2}-(?:[A-Z]{2}|\d{3})) ([^{}]+)\}$/;

const axis = (name: string): string => AXES[name] ?? name;
// A form without the term marks around its words: a form is the course's own text, which takes no term.
const unterm = (form: string): string => form.replace(/\{term ([^{}]*)\}/g, "$1");

// The fields of a node in the order given, the rest after them.
const ordered = (node: Node, keys: string[]): Node => {
  const entries: [string, unknown][] = [
    ...keys.filter((k) => node[k] !== undefined).map((k): [string, unknown] => [k, node[k]]),
    ...Object.entries(node).filter(([k]) => !keys.includes(k)),
  ];
  return Object.fromEntries(entries);
};

function item(old: Node): Node {
  const { letter, small, word, name, ...rest } = old;
  const form = letter !== undefined ? (small !== undefined ? [letter, small] : letter) : word;
  return ordered({ ...rest, ...(form !== undefined && { form }), ...(name !== undefined && { ipa: name }) }, [
    "id",
    "to",
    "variety",
    "form",
    "ipa",
    "text",
    "ex",
  ]);
}

function cell(value: unknown): unknown {
  if (typeof value === "string") return unterm(value);
  if (!Array.isArray(value)) return value;
  return value.map((v: unknown) => {
    const lone = typeof v === "string" ? LONE_VARIANT.exec(v) : null;
    return lone === null ? cell(v) : { form: lone[2], variety: lone[1] };
  });
}

// A table in the new shape stays as it is, so the conversion runs again with no change.
function table(old: Node): Node {
  if (!Array.isArray(old["axes"])) return old;
  const [rows = "", columns = ""] = (old["axes"] as string[]).map(axis);
  const key = (k: string, n: number): string => (n === 0 ? rows : (VALUES[k] ?? k));
  const keys = (old["columns"] as Node[]).map((c, n) => [c["key"] as string, key(c["key"] as string, n)] as const);
  return {
    ...old,
    axes: { rows, columns },
    columns: (old["columns"] as Node[]).map((c, n) => ({ ...c, key: key(c["key"] as string, n) })),
    rows: (old["rows"] as Node[]).map((r) => ({
      id: r["id"],
      features: r["features"],
      cells: Object.fromEntries(keys.filter(([from]) => r[from] !== undefined).map(([from, to]) => [to, cell(r[from])])),
    })),
  };
}

function block(old: Node): Node {
  if (old["type"] === "table") return table(old);
  if (old["type"] === "list") return { ...old, items: (old["items"] as Node[]).map(item) };
  return old;
}

function error(old: Node): Node {
  return { ...old, wrong: unterm(old["wrong"] as string), right: typeof old["right"] === "string" ? unterm(old["right"]) : old["right"] };
}

export function convertSource(old: Node): Node {
  const rest = Object.fromEntries(Object.entries(old).filter(([k]) => k !== "course" && k !== "source"));
  return {
    ...rest,
    essence: (old["essence"] as Node[]).map((l) => {
      const line = item(l);
      return { ...line, ...(typeof line["form"] === "string" && { form: unterm(line["form"]) }) };
    }),
    subtopics: (old["subtopics"] as Node[]).map((s) => ({ ...s, blocks: (s["blocks"] as Node[]).map(block) })),
    errors: (old["errors"] as Node[]).map(error),
  };
}

export interface Sample {
  slug: string;
  source: Node;
  // The English of its title and subtopic titles: its source's, or its English file's.
  english: (id: string) => string;
}

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
// Today's topics the samples continue (IX-24).
const REPLACES: Record<string, string> = {
  "en.alphabet": "en.foundations.alphabet-spelling",
  "en.words-of-place": "en.prepositions.place-movement",
  "en.present-simple": "en.tenses.simple-tenses",
  "es.subject-pronouns": "es.pronombres.pronombres-sujeto",
};
const EXTRA: Record<string, Node> = { "en.alphabet": { script: "alphabet" }, "en.words-of-place": { practical: "words-of-place" } };

// A course's index of samples: the course's name, its source and varieties, one section of its topics, each defined by
// its English title and subtopic titles and placed in the study path at each of its levels, in the order given.
export function sampleIndex(course: string, name: unknown, varieties: string[] | undefined, section: unknown, samples: Sample[]): Node {
  const places = new Map<string, number>();
  const topics = samples.map(({ slug, source, english }) => {
    const subtopics = source["subtopics"] as Node[];
    const levels = LEVELS.filter((l) => subtopics.some((s) => s["level"] === l));
    const path = Object.fromEntries(
      levels.map((l) => {
        places.set(l, (places.get(l) ?? 0) + 1);
        return [l, places.get(l)];
      }),
    );
    const id = source["id"] as string;
    return {
      id: slug,
      subject: english("title"),
      covers: subtopics.map((s) => english((s["title"] as Node)["id"] as string)),
      path,
      status: "draft",
      ...(REPLACES[id] !== undefined && { replaces: REPLACES[id] }),
      ...EXTRA[id],
    };
  });
  return {
    course,
    name,
    source: course,
    ...(varieties !== undefined && { varieties }),
    status: "draft",
    sections: [{ id: "topics", name: section, topics }],
  };
}
