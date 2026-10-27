// The "Explained in" line of a course (explained-line.ts): a button holding the default text in the page's language,
// the course's explanation languages source first, and the name of the language in the page's language.
import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { ENABLED_EXPLAIN, loadCurriculum, localize, say, SITE } from "../../scripts/lib.ts";
import { explainsOf } from "./context.ts";
import { defaultExplain, explainedLine, explainedText, explainNameIn } from "./explained-line.ts";

const { languages } = await loadCurriculum();
const english = languages.find((l) => l.code === "en");
const spanish = languages.find((l) => l.code === "es");
if (english === undefined || spanish === undefined) throw new Error("the sample lacks English or Spanish");
const parse = (html: string): Element | null => parseHTML(`<html><body>${html}</body></html>`).document.querySelector("button");

describe("the language names", () => {
  test("an explanation language is named in the page's language, from site.yaml", () => {
    expect(explainNameIn("uk", "en")).toBe("Ukrainian");
    expect(explainNameIn("en", "uk")).toBe(localize(SITE.explain.find((x) => x.code === "en")?.name ?? {}, "uk"));
    expect(explainNameIn("ja", "en")).toBe("Japanese");
  });
  test("a course opens in the page's language when it has it, else in its first", () => {
    for (const lang of languages) {
      const has = explainsOf(lang);
      for (const e of ENABLED_EXPLAIN) expect(defaultExplain(lang, e)).toBe(has.includes(e) ? e : (has[0] ?? e));
    }
  });
});

describe("the line", () => {
  test("holds the default text with the language in bold, in the page's language", () => {
    for (const e of ENABLED_EXPLAIN) {
      const button = parse(explainedLine(english, e));
      const name = explainNameIn(defaultExplain(english, e), e);
      expect((button?.querySelector(".xl-text b")?.textContent ?? "").toLowerCase()).toBe(name.toLowerCase());
      expect(button?.textContent).toBe(say("courseExplainedIn", e, { language: name }));
    }
  });
  test("is a button naming its course and its explanation languages, and opens a dialog", () => {
    const button = parse(explainedLine(spanish, "en", "hm-explained"));
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.className).toBe("xl-line hm-explained");
    expect(button?.getAttribute("data-course")).toBe("es");
    expect(button?.getAttribute("data-explains")).toBe(explainsOf(spanish).join(" "));
    expect(button?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(parse(explainedLine(spanish, "en"))?.className).toBe("xl-line");
  });
  test("writes the language as the page's template does", () => {
    expect(explainedText(english, "en")).toBe("Explained in: <b>English</b>");
    expect(explainedText(english, "uk")).toBe("Мова пояснень: <b>українська</b>");
  });
});
