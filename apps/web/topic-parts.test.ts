// A topic's parts for the course index's right pane (topic-parts.ts): the title, the mark and reading time, the lead,
// Contents with a numbered part per row, and Up next per order and level.
import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { loadCurriculum, loadTopics, localize, type TopicRef } from "../../scripts/lib.ts";
import { type Context, explainsOf, type Track } from "./context.ts";
import { guideSections } from "./guide.ts";
import { escapeHtml } from "./html.ts";
import { anchorIds } from "./parts.ts";
import { studyPath } from "./path.ts";
import { SAMPLE } from "./sample.ts";
import { topicParts } from "./topic-parts.ts";
import { ui } from "./ui.ts";
import { topicUrl, trackUrl } from "./urls.ts";

function need<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("the sample lacks what the test reads");
  return value;
}
const curriculum = await loadCurriculum();
const refs = (await loadTopics(curriculum)).filter((r) => SAMPLE.topics.includes(r.id));
const lang = need(curriculum.languages.find((l) => l.code === "en"));
const langRefs = refs.filter((r) => r.lang === lang.code);
const written = langRefs.filter((r) => r.topic);
const ctx = { refs, link: () => null, languages: [lang] } as unknown as Context;
const track: Track = {
  ctx,
  lang,
  explain: "en",
  explains: explainsOf(lang),
  t: ui("en"),
  title: ui("en").track(localize(lang.name, "en")),
  langRefs,
  written,
  path: studyPath(lang, "en", langRefs),
};

function partsOf(ref: TopicRef): string {
  const all = guideSections({ ref, explain: "en", refs, link: () => null, varieties: lang.varieties, lesson: true });
  const ids = anchorIds(all.map((s) => s.title));
  return topicParts(track, ref, { all, ids, props: "<b class=pr>mark</b>", lead: "The lead." });
}
const tenses = need(refs.find((r) => r.id === "en.tenses.simple-tenses"));
const doc = parseHTML(`<html><body>${partsOf(tenses)}</body></html>`).document;

describe("a topic's parts", () => {
  test("is the fragment, holding the title, the props, the lead and Contents", () => {
    const root = doc.querySelector(".tpp");
    expect(root?.hasAttribute("data-sp-fragment")).toBe(true);
    expect(doc.querySelectorAll("[data-sp-fragment]").length).toBe(1);
    expect(doc.querySelector(".tpp-title")?.textContent).toContain("Simple Tenses");
    expect(doc.querySelector(".tpp-flag")?.textContent).toBe(lang.flag);
    expect(doc.querySelector(".tpp-props .pr")).not.toBeNull();
    expect(doc.querySelector(".tpp-lead")?.textContent).toBe("The lead.");
    expect(doc.querySelector("h3.tpp-caps")?.textContent).toBe(ui("en").contents);
  });

  test("numbers the parts from the summary's 00, each linking to its anchor on the topic's page with its mark", () => {
    const rows = [...doc.querySelectorAll(".tpp-rows > li")];
    const numbers = rows.map((r) => r.querySelector(".tpp-n")?.textContent);
    expect(numbers[0]).toBe("00");
    expect(numbers.slice(0, 3)).toEqual(["00", "01", "02"]);
    expect(numbers.length).toBeGreaterThan(5);
    const url = topicUrl("en", lang, tenses);
    for (const row of rows) {
      const a = row.querySelector("a.ix-cover");
      expect(a?.getAttribute("href")?.startsWith(`${url}#`)).toBe(true);
      expect(a?.getAttribute("href")?.length).toBeGreaterThan(url.length + 1);
      expect(row.querySelector(".ix-chev")).not.toBeNull();
    }
    const marks = rows.map((r) => r.querySelector("button.lvm")?.getAttribute("data-lv"));
    expect(marks.slice(0, 3)).toEqual(["s0", "s1", "s2"]);
  });

  test("ends with Up next for each order and level, the by-level one at the topic's lowest step, none hidden", () => {
    const next = [...doc.querySelectorAll(".tpp-next")];
    expect(next.length).toBeGreaterThan(0);
    expect(new Set(next.map((n) => n.getAttribute("data-order")))).toEqual(new Set(["categories", "path"]));
    for (const n of next) {
      expect(n.getAttribute("data-at")).not.toBe("");
      expect(n.hasAttribute("hidden")).toBe(false);
      expect(n.querySelector(".tpp-link strong")?.textContent).not.toBe("");
      expect(n.querySelector(".tpp-link .lvm")).not.toBeNull();
      expect(n.querySelector(".tpp-link .tpp-sum")).not.toBeNull();
    }
    const path = next.filter((n) => n.getAttribute("data-order") === "path");
    expect(path.every((n) => n.querySelector("a")?.hasAttribute("data-path-step") === true)).toBe(true);
    expect(trackUrl("en", lang)).toBe("/en/english/");
  });

  test("names the way back to the start from the last topic of an order", () => {
    const last = need(written.at(-1));
    const html = partsOf(last);
    expect(html).toContain(escapeHtml(ui("en").startOver));
  });
});
