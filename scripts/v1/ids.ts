// Gives each element of a topic that lacks an id one, from its parent's id and its kind, and keeps every id already
// written: an edited sentence keeps its id, and an inserted block or sentence takes a new one, moving no other. A
// sentence or an item takes the next free number of its block (`names.fact.3`), a block its subtopic's id and kind
// (`names.why`), a part of an element the element's id (`err.2.rule`); an id already taken gains `-2`, `-3`.
// The files are read loosely, as a writer leaves them before the schema holds.
import { idsIn } from "./structure.ts";

type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => typeof value === "object" && value !== null && !Array.isArray(value);
const nodes = (value: unknown): Node[] => (Array.isArray(value) ? value.filter(isNode) : []);
const text = (value: unknown): string => (typeof value === "string" ? value : "");

class Ids {
  readonly added: string[] = [];
  constructor(private readonly taken: Set<string>) {}

  // The node's id, given from the base where it has none.
  give(node: Node, base: string): string {
    if (typeof node["id"] === "string") return node["id"];
    let id = base;
    for (let n = 2; this.taken.has(id); n++) id = `${base}-${n}`;
    this.taken.add(id);
    this.added.push(id);
    node["id"] = id;
    return id;
  }

  // The node's id, the next free number after the prefix where it has none.
  number(node: Node, prefix: string): string {
    if (typeof node["id"] === "string") return node["id"];
    let n = 1;
    while (this.taken.has(`${prefix}.${n}`)) n++;
    return this.give(node, `${prefix}.${n}`);
  }

  // The ids of an error and its parts: its correction where it is a sentence, its rule and its speakers' reasons.
  error(e: Node, prefix: string): void {
    const id = this.number(e, prefix);
    if (isNode(e["right"])) this.give(e["right"], `${id}.right`);
    if (isNode(e["rule"])) this.give(e["rule"], `${id}.rule`);
    for (const [language, reason] of Object.entries(isNode(e["speakers"]) ? e["speakers"] : {})) {
      if (isNode(reason)) this.give(reason, `${id}.${language}`);
    }
  }

  // The ids of a block of a subtopic, or of a language's own block, and of its sentences, items and cells.
  block(b: Node, base: string): void {
    const id = this.give(b, base);
    for (const s of nodes(b["text"])) this.number(s, id);
    for (const item of nodes(b["items"])) {
      const itemId = this.number(item, id);
      if (isNode(item["ex"])) this.give(item["ex"], `${itemId}.ex`);
    }
    for (const c of nodes(b["columns"])) this.give(c, `${id}.col.${text(c["key"])}`);
    for (const r of nodes(b["rows"])) {
      const row = this.number(r, `${id}.row`);
      for (const cell of Object.values(isNode(r["cells"]) ? r["cells"] : {})) if (isNode(cell)) this.give(cell, `${row}.name`);
    }
  }
}

// The ids of a topic's source file; `taken` holds the ids of its language files.
export function assignSourceIds(source: Node, taken: string[] = []): string[] {
  const ids = new Ids(new Set([...idsIn({ ...source, id: undefined }), ...taken]));
  if (isNode(source["title"])) ids.give(source["title"], "title");
  if (isNode(source["definition"])) ids.give(source["definition"], "def");
  for (const line of nodes(source["essence"])) {
    const id = ids.number(line, "ess");
    if (isNode(line["ex"])) ids.give(line["ex"], `${id}.ex`);
  }
  nodes(source["subtopics"]).forEach((s, n) => {
    const sub = ids.give(s, `part-${n + 1}`);
    if (isNode(s["title"])) ids.give(s["title"], `${sub}.title`);
    for (const b of nodes(s["blocks"])) ids.block(b, `${sub}.${text(b["type"])}`);
  });
  for (const e of nodes(source["errors"])) ids.error(e, "err");
  if (isNode(source["picture"])) ids.give(source["picture"], "picture");
  return ids.added;
}

// The ids of a language file's own blocks, errors and speakers' reasons, each starting with its language.
export function assignLanguageIds(file: Node, taken: string[] = []): string[] {
  const language = text(file["language"]);
  const ids = new Ids(new Set([...idsIn([file["blocks"], file["errors"], file["speakers"]]), ...taken]));
  for (const b of nodes(file["blocks"])) ids.block(b, `${language}.${text(b["in"])}.${text(b["type"])}`);
  for (const e of nodes(file["errors"])) ids.error(e, `${language}.err`);
  for (const [error, reason] of Object.entries(isNode(file["speakers"]) ? file["speakers"] : {})) {
    if (isNode(reason)) ids.give(reason, `${language}.${error}.${language}`);
  }
  return ids.added;
}

// The ids of a topic: its source file's, then each language file's, every id unique across them all.
export function assignTopicIds(source: Node, languages: Node[]): string[] {
  const own = (file: Node): string[] => idsIn([file["blocks"], file["errors"], file["speakers"]]);
  const added = assignSourceIds(source, languages.flatMap(own));
  for (const file of languages) {
    added.push(...assignLanguageIds(file, [...idsIn({ ...source, id: undefined }), ...languages.filter((l) => l !== file).flatMap(own)]));
  }
  return added;
}
