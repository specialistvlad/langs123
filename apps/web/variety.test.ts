// Varieties in topic content: on a language with varieties, a table row or a block of one variety names
// it for the Variety switch, and merged cells stop where the variety changes.
import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import type { Block, Item, TopicRef } from "../../scripts/lib.ts";
import type { Ctx } from "./html.ts";
import { blocksHtml } from "./render.ts";

const ctx = (varieties?: Ctx["varieties"]): Ctx => ({
  ref: { id: "es.sample.topic", lang: "es" } as TopicRef,
  explain: "en",
  refs: [],
  link: () => null,
  varieties,
});
describe("varieties", () => {
  // The Spanish paradigm of ser: the vosotros row belongs to Spain alone.
  const ser: Block = {
    type: "paradigm",
    columns: [
      { key: "tense", label: { en: "Tense" } },
      { key: "qs", slot: "subj", features: { interrogativity: "decl", polarity: "pos" } },
      { key: "qv", slot: "verb", features: { interrogativity: "decl", polarity: "pos" } },
    ],
    rows: [
      { level: "A1", features: { person: 1, number: "pl" }, tense: { en: "Present" }, qs: "nosotros", qv: "somos" },
      { level: "A1", features: { person: 2, number: "pl" }, variety: "es-ES", tense: { en: "Present" }, qs: "vosotros", qv: "sois" },
      { level: "A1", features: { person: 3, number: "pl" }, tense: { en: "Present" }, qs: "ellos", qv: "son" },
    ],
  };
  const spanish = (blocks: Block[], varieties?: Ctx["varieties"]): Document =>
    parseHTML(`<main>${blocksHtml(blocks, ctx(varieties), "A1")}</main>`).document;
  test("on a language with varieties, a row of one variety names it, and merges stop around it", () => {
    const d = spanish([ser], ["es-419", "es-ES"]);
    expect([...d.querySelectorAll("tbody tr:not(.gap-row)")].map((tr) => tr.getAttribute("data-variety"))).toEqual([null, "es-ES", null]);
    expect(d.querySelector("tr.gap-row[data-variety='es-ES']")).not.toBeNull();
    expect([...d.querySelectorAll("td.key")].map((td) => td.getAttribute("rowspan"))).toEqual([null, null, null]);
  });
  test("on a language without varieties, rows merge and name none", () => {
    const d = spanish([ser]);
    expect(d.querySelector("[data-variety]")).toBeNull();
    expect(d.querySelector("td.key")?.getAttribute("rowspan")).toBe("3");
  });
  test("a block whose leaves all belong to one variety names it", () => {
    const ustedes: Item = { type: "note", level: "A1", variety: "es-419", text: { en: "ustedes" } };
    const only: Block = { type: "list", items: [ustedes] };
    const mixed: Block = { type: "list", items: [ustedes, { type: "note", level: "A1", text: { en: "all" } }] };
    const d = spanish([only, mixed], ["es-419", "es-ES"]);
    expect([...d.querySelectorAll(".blk")].map((b) => b.getAttribute("data-variety"))).toEqual(["es-419", null]);
  });
  test("a block whose leaves start later in one variety names that variety's level", () => {
    const spain: Item = { type: "note", level: "A1", variety: "es-ES", text: { en: "tú with strangers" } };
    const block: Block = { type: "list", items: [spain, { type: "note", level: "A2", text: { en: "usted" } }] };
    const blk = spanish([block], ["es-419", "es-ES"]).querySelector(".blk");
    expect(blk?.getAttribute("data-level")).toBe("A1");
    expect(blk?.getAttribute("data-level-es-419")).toBe("A2");
    expect(blk?.hasAttribute("data-level-es-es")).toBe(false);
  });
});
