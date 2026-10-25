// Every Read in menu: a note, then each explanation language by its own name with its name in the language read in
// under it (one line when the two are the same), no flags, the language read in ticked; the labels that meet their
// values (Variety, Previous, Next, Read in) as each language writes them.
import { describe, expect, test } from "bun:test";
import { ENABLED_EXPLAIN, type Explain, explainName, say } from "../../scripts/lib.ts";
import { type Choice, readChoices } from "./context.ts";
import { readItems } from "./read-menu.ts";
import { readPage, testSite } from "./test-site.ts";
import { readMenu } from "./toolbar.ts";
import { ui } from "./ui.ts";
import { homeUrl } from "./urls.ts";

// The sample site, built once before the tests read its pages.
await testSite();

const choices = (home: Explain): Choice[] => readChoices(home, homeUrl);
const homeFile = (e: Explain): string => `${homeUrl(e).slice(1)}index.html`;
const text = (el: Element | null | undefined): string => el?.textContent ?? "";

describe("the choices of a page read in English", () => {
  const list = choices("en");
  test("name each language by its own name, and in English under it when that differs", () => {
    expect(list.map((c) => [c.lang, c.label])).toEqual(ENABLED_EXPLAIN.map((e) => [e, explainName(e)]));
    expect(list.filter((c) => c.sub === "").map((c) => c.lang)).toEqual(["en"]);
    expect(list.find((c) => c.lang === "uk")).toMatchObject({ label: "Українська", sub: "Ukrainian" });
    expect(list.find((c) => c.lang === "ja")).toMatchObject({ label: "日本語", sub: "Japanese" });
    expect(list.filter((c) => c.on).map((c) => c.lang)).toEqual(["en"]);
  });
});

describe("a language whose two names are the same shows one name", () => {
  test("on every page, the language read in has no second line", () => {
    for (const e of ENABLED_EXPLAIN) expect(choices(e).find((c) => c.on)?.sub).toBe("");
  });
  test("under a language read in Ukrainian, the others carry their Ukrainian names", () => {
    expect(choices("uk").find((c) => c.lang === "en")).toMatchObject({ label: "English", sub: "Англійська" });
  });
});

describe("readItems", () => {
  const html = readItems(ui("en"), choices("en"));
  test("opens with the note, then holds an item per language with its tick", () => {
    expect(html.startsWith(`<p class="ix-hint">${ui("en").readNote}</p>`)).toBe(true);
    expect(html.match(/role="menuitemradio"/g)).toHaveLength(ENABLED_EXPLAIN.length);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
  });
  test("gives a second line to the languages named differently, and no flag", () => {
    expect(html).toContain('<span class="ix-title">Українська</span><span class="ix-sub">Ukrainian</span>');
    expect(html).toContain('<span class="ix-title">English</span></span>');
    expect(html).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u);
  });
});

describe("readMenu", () => {
  test("names the language read in on its button, as its language writes the label", () => {
    const fr = readMenu(ui("fr"), choices("fr"));
    expect(fr).toContain(`aria-label="${say("labelled", "fr", { label: ui("fr").read, value: "Français" })}"`);
    expect(fr).toContain('role="menu"');
    expect(fr).toContain('class="hm-menu hm-ticks"');
  });
  test("a page with no choice read in names the label alone", () => {
    expect(readMenu(ui("en"), [])).toContain(`aria-label="${ui("en").read}"`);
  });
});

describe.each(ENABLED_EXPLAIN)("the Home in %s", (home) => {
  test("holds the note and every language in its Read in menus, the toolbar's and the filter chip's", async () => {
    const doc = await readPage(homeFile(home));
    for (const menu of [doc.querySelector(".hm-read .hm-menu"), doc.getElementById("hm-f-read")]) {
      expect(text(menu?.querySelector(".ix-hint"))).toBe(ui(home).readNote);
      const items = [...(menu?.querySelectorAll("a.ix-item") ?? [])];
      expect(items.map((a) => a.getAttribute("data-read"))).toEqual(ENABLED_EXPLAIN);
      expect(items.filter((a) => a.getAttribute("aria-checked") === "true").map((a) => a.getAttribute("data-read"))).toEqual([home]);
      expect(items.find((a) => a.getAttribute("data-read") === "ja")?.querySelector(".ix-title")?.textContent).toBe("日本語");
    }
  });
});

describe("the labels that meet their values", () => {
  test("the variety chip reads the label and the variety's name as the language writes them", async () => {
    const en = await readPage(homeFile("en"));
    const chip = en.querySelector(".hm-fchip[data-variety-course] .hm-fchip-l");
    expect(text(chip).replace(/\s+/g, " ")).toMatch(/^Variety: \S+$/);
    expect(en.querySelectorAll("#hm-filters [data-set-variety], [id^=hm-f-variety-] [data-set-variety]").length).toBeGreaterThan(0);
    expect(en.querySelector('[id^="hm-f-variety-"] [data-all]')).toBeNull();
    const fr = await readPage(homeFile("fr"));
    const [before = ""] = say("labelled", "fr", { label: ui("fr").variety }).split("{value}");
    expect(text(fr.querySelector(".hm-fchip[data-variety-course] .hm-fchip-l")).startsWith(before)).toBe(true);
  });
  test("a topic's variety button, Previous and Next read as each language writes them", async () => {
    for (const e of ["en", "uk", "es"] as const) {
      const doc = await readPage(`${e}/spanish/presente/presente-regular/index.html`);
      expect(text(doc.querySelector(".tp-variety .sr-only"))).toBe(say("labelled", e, { label: ui(e).variety, value: "" }));
      const prefix = say("labelled", e, { label: ui(e).previous, value: "" });
      const labels = [...doc.querySelectorAll(".tp-prev")].map((a) => a.getAttribute("aria-label") ?? "");
      expect(labels.length).toBeGreaterThan(0);
      for (const label of labels) expect(label === prefix.trimEnd() || label.startsWith(prefix)).toBe(true);
      const next = say("labelled", e, { label: ui(e).next, value: "" });
      const nexts = [...doc.querySelectorAll(".tp-next:not(.tp-restart)")].map((a) => a.getAttribute("aria-label") ?? "");
      for (const label of nexts) expect(label.startsWith(next)).toBe(true);
    }
  });
});
