// The end of a topic page: Up next, then the study path, a row for each level the topic is a step of, with the level's
// mark and name, the step's place among the level's steps, and the steps before and after it; no previous and next
// capsules; a row of a level above the filter carries its level so the filter hides it.
import { describe, expect, test } from "bun:test";
import { levelName, type Level, say, type TopicRef } from "../../scripts/lib.ts";
import type { Track } from "./context.ts";
import { studyPath } from "./lesson-chrome.ts";
import { ui } from "./ui.ts";
import { readPage, testSite } from "./test-site.ts";

await testSite();
const index = await readPage("en/english/index.html");
const URL_OF = "/en/english/verbs/to-be/";
const topic = await readPage(`${URL_OF.slice(1)}index.html`);
const end = topic.querySelector(".tp-end");

// The index's steps of each level, as their topics' addresses.
const stages = [...index.querySelectorAll('.ix-flow[data-order="path"] .ix-sec')].map((sec) => ({
  level: sec.getAttribute("data-level") ?? "",
  steps: [...sec.querySelectorAll("a.ix-cover")].map((a) => (a.getAttribute("href") ?? "").split(/[?#]/)[0] ?? ""),
}));
const mine = stages.flatMap((s) => (s.steps.includes(URL_OF) ? [s] : []));

describe("the end of a topic page", () => {
  test("holds Up next, then the study path, and no capsule", () => {
    const parts = [...(end?.children ?? [])].map((el) => el.className.split(" ")[0]);
    expect(parts.at(-1)).toBe("tp-study");
    expect(parts.slice(0, -1).length).toBeGreaterThan(0);
    expect(parts.slice(0, -1).every((part) => part === "up-next")).toBe(true);
    expect(topic.querySelector(".tp-pager, .tp-pagers, .tp-end-pagers")).toBeNull();
    expect(end?.querySelector(".tp-study > .tp-caps")?.textContent).toBe("Study path");
  });

  test("the study path has a row for each level the topic is a step of, lowest first", () => {
    expect(mine.length).toBeGreaterThan(0);
    const rows = [...topic.querySelectorAll(".tp-study .tp-path-row")];
    expect(rows.map((row) => row.getAttribute("data-level"))).toEqual(mine.map((s) => s.level));
    expect(rows.every((row) => row.getAttribute("data-to") === row.getAttribute("data-level"))).toBe(true);
  });

  test("each row names the level with its mark, the step's place and the steps around it", () => {
    for (const [i, stage] of mine.entries()) {
      const row = topic.querySelectorAll(".tp-study .tp-path-row")[i];
      const at = stage.steps.indexOf(URL_OF);
      const where = say("pathStep", "en", { n: String(at + 1), total: String(stage.steps.length) });
      expect(row?.querySelector(".tp-path-h > .lvm .lvm-t")?.textContent).toBe(stage.level);
      expect(row?.querySelector(".tp-path-h > span:not(.lvm)")?.textContent).toBe(
        `${stage.level} ${levelName(stage.level as Level, "en")} · ${where}`,
      );
      const links = [...(row?.querySelectorAll(".tp-path-n a") ?? [])];
      const around = [stage.steps[at - 1], stage.steps[at + 1]].flatMap((href) => (href === undefined ? [] : [href]));
      expect(links.map((a) => (a.getAttribute("href") ?? "").split(/[?#]/)[0])).toEqual(around);
      expect(links.every((a) => a.getAttribute("data-path-step") === stage.level.toLowerCase())).toBe(true);
      expect(row?.querySelector(".tp-path-n .tp-nx")?.getAttribute("href")).toBe(
        stage.steps[at + 1] === undefined ? undefined : links.at(-1)?.getAttribute("href"),
      );
    }
  });
});

test("a topic on no level's path has no study path card", () => {
  expect(studyPath({ explain: "en", t: ui("en"), path: [] } as unknown as Track, {} as TopicRef)).toBe("");
});
