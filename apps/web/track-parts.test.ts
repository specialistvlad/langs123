// A track's index lists its planned topics too: a row without a link, its planned levels lit and no popover.
import { expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { loadCurriculum, loadTopics } from "../../scripts/lib.ts";
import type { Track } from "./context.ts";
import { byCategory } from "./track-parts.ts";

const curriculum = await loadCurriculum();
const refs = await loadTopics(curriculum);

test("a planned topic's row has no link and no popover, and lights its planned levels", () => {
  const lang = curriculum.languages[0];
  const written = refs.find((r) => r.lang === lang?.code && r.topic !== null);
  if (lang === undefined || written === undefined) throw new Error("the curriculum has no written topic");
  const planned = { ...written, topic: null, entry: { ...written.entry, levels: "A1-B1" } };
  const entries = {};
  const html = byCategory({ lang, explain: "en", langRefs: [planned] } as unknown as Track, entries);
  const row = parseHTML(`<div>${html}</div>`).document.querySelector("li.ix-todo");
  expect(row?.querySelector("a")).toBeNull();
  expect(row?.querySelector("button")).toBeNull();
  expect([...(row?.querySelectorAll(".lvm > i.on") ?? [])].map((i) => i.className)).toEqual(["lv-A1 on", "lv-A2 on", "lv-B1 on"]);
  expect(entries).toEqual({});
});
