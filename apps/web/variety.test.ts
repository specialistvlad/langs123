// Varieties in topic content: on a language with varieties, a table row or a block of one variety names
// it for the Variety switch, merged cells stop where the variety changes, and neighbouring variants
// swap in one place.
import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import type { Block, Item, Mark, Text, TopicRef } from "../../scripts/lib.ts";
import { type Ctx, inline } from "./html.ts";
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

describe("swaps", () => {
  const ve: Mark = { variant: "ve", variety: "es-419" };
  const uve: Mark = { variant: "uve", variety: "es-ES" };
  const spanishCtx = (pick?: Ctx["pick"]): Ctx => ({ ...ctx(["es-419", "es-ES"]), pick });
  const html = (text: Text, c: Ctx, plain = true): Document => parseHTML(`<main>${inline(text, c, plain)}</main>`).document;
  // The text a variant shows: its form, without the variety's name kept for screen readers.
  const shown = (el: Element): string =>
    [...el.childNodes]
      .filter((n) => !(n.nodeType === 1 && (n as Element).classList.contains("sr-only")))
      .map((n) => n.textContent)
      .join("");
  test("neighbouring variants stand as one: each shows its form and names its variety for screen readers", () => {
    const d = html(["¿Con be o con ", ve, " ", uve, "?"], spanishCtx());
    const variants = [...d.querySelectorAll("[data-mark='variant']")];
    expect(variants.map((v) => v.getAttribute("data-variety"))).toEqual(["es-419", "es-ES"]);
    expect(variants.map(shown)).toEqual(["ve", "uve"]);
    expect(variants.map((v) => [...v.querySelectorAll(".sr-only")].map((s) => s.textContent).join(""))).toEqual([
      "(Latin America: )",
      "(Spain: )",
    ]);
    expect(variants[0]?.nextSibling).toBe(variants[1] ?? null);
    expect(variants[1]?.nextSibling?.textContent).toBe("?");
  });
  test("a variant in an explanation names its variety without parentheses", () => {
    const d = html(["the name ", ve, " ", uve], spanishCtx(), false);
    expect([...d.querySelectorAll(".sr-only")].map((s) => s.textContent)).toEqual(["Latin America: ", "Spain: "]);
  });
  test("a copy in one variety holds its forms alone, as plain text", () => {
    expect(html(["¿Con be o con ", ve, " ", uve, "?"], spanishCtx("es-419")).querySelector("main")?.textContent).toBe("¿Con be o con ve?");
    expect(html(["¿Con be o con ", ve, " ", uve, "?"], spanishCtx("es-ES")).querySelector("main")?.textContent).toBe("¿Con be o con uve?");
  });
  test("a table cell with variants holds a copy in each variety", () => {
    const table: Block = {
      type: "usage",
      columns: [{ key: "name", label: { en: "Name" } }],
      rows: [{ level: "A0", name: [ve, " ", uve] }],
    };
    const d = parseHTML(`<main>${blocksHtml([table], spanishCtx(), "A0")}</main>`).document;
    const copies = [...d.querySelectorAll("td .cell-variety")];
    expect(copies.map((c) => [c.getAttribute("data-variety"), c.textContent])).toEqual([
      ["es-419", "ve"],
      ["es-ES", "uve"],
    ]);
  });
  test("on a language without varieties a variant names its variety in the text", () => {
    const us: Mark = { variant: "on the weekend", variety: "en-US" };
    const d = html(["We relax at the weekend. ", us], ctx());
    expect(d.querySelector(".cell-variety, .sr-only")).toBeNull();
    expect(d.querySelector("[data-mark='variant']")?.textContent).toBe("(US: on the weekend)");
  });
});
