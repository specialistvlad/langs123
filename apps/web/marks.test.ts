// Every built page shows topic text through its marks: every bold or italic piece of content names the mark
// it shows. The build itself stops on unrendered notation (output.ts leftovers).
import { describe, expect, test } from "bun:test";
import { MARKS } from "../../scripts/text.ts";
import { readPage, testSite } from "./test-site.ts";

const pages = await testSite();
const contentPages = pages.filter((p) => p.endsWith("index.html"));
// Names the renderer gives beside the marks of the data: a translation and the variety a note is about.
const NAMES = new Set<string>([...MARKS, "translation", "variety"]);

describe.each(contentPages)("%s", (path) => {
  test("every mark has a known name, and every bold or italic piece of content names its mark", async () => {
    const doc = await readPage(path);
    for (const el of doc.querySelectorAll("[data-mark]")) expect(NAMES.has(el.getAttribute("data-mark") ?? "")).toBe(true);
    for (const el of doc.querySelectorAll(":is(.sections, .doc > blockquote, .lanes, .blk) :is(strong, em)")) {
      expect(el.hasAttribute("data-mark")).toBe(true);
    }
  });
});
