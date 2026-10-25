// A course's level line joins the topics covering a level and those starting there as each language joins them:
// French with a no-break space before its semicolon, Japanese with the second part in brackets.
import { expect, test } from "bun:test";
import { loadCurriculum, loadTopics } from "../../scripts/lib.ts";
import { courseEntry } from "./level-popover.ts";

const curriculum = await loadCurriculum();
const english = (await loadTopics(curriculum)).filter((r) => r.lang === "en");

test("a course's line joins what covers a level and what starts there in the words of its language", () => {
  const a0 = (explain: "en" | "fr" | "ja"): string => courseEntry("", english, explain).l.A0 ?? "";
  expect(a0("en")).toMatch(/^\d+ topics? covers? A0; \d+ starts? here$/);
  expect(a0("fr")).toMatch(/\S\u00a0; \d/);
  expect(a0("ja")).toMatch(/^[^（]+（うち\d+トピックはここから始まる）$/);
});
