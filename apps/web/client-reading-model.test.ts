// The reading's choices: the reader's languages for a topic, the page's first and the kept list's that the topic has after
// it, three at most; the kept form, interleaved when the browser keeps none or one it no longer knows; and a layer merged
// into a page's topic, which then reads as the whole topic does (7.4).
import { expect, test } from "bun:test";
import { exportLibrary } from "../../scripts/export.ts";
import type { Topic } from "../../scripts/generated/export-v1.ts";
import { layerOf, topicIn } from "../../scripts/v1/export/layers.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { keptForm, layersToLoad, mergeLayer, readerLanguages, readerSpeakers } from "./client-reading-model.ts";
import { Reading } from "./reading.ts";
import { article, FORMS } from "./reading-layers.ts";
import { Words } from "./reading-words.ts";

test("a page's topic, cut to its languages, reads as the whole once the other languages' layers merge back by id", async () => {
  const v1 = await exportLibrary({ library: "v1", root: SAMPLES_ROOT, drafts: true });
  const topic = v1.courses.flatMap((c) => c.topics).find((t) => t.id === "en.present-simple");
  if (topic === undefined) throw new Error("no sample");
  expect(layersToLoad(["uk", "en", "ja"], ["en", "uk"])).toEqual(["ja"]);
  const words = Words.of(v1.library, "uk");
  const read = (t: Topic, form: (typeof FORMS)[number]): string =>
    article(new Reading(t, "en", ["uk", "en", "ja"], words, 1100, "en-GB", 1100), form);
  const cut = structuredClone(topicIn(topic, ["en", "uk"]));
  expect(read(cut, "interleaved")).not.toBe(read(topic, "interleaved"));
  const merged = mergeLayer(cut, layerOf(topic, "en", "ja"));
  for (const form of FORMS) expect(read(merged, form)).toBe(read(topic, form));
});

test("the reader's languages open with the page's and keep the topic's from the list, three at most", () => {
  expect(readerLanguages("uk", null, ["en", "uk", "ja"])).toEqual(["uk"]);
  expect(readerLanguages("uk", "uk ja fr", ["en", "uk", "ja"])).toEqual(["uk", "ja"]);
  expect(readerLanguages("en", "uk ja es", ["en", "uk", "ja", "es"])).toEqual(["en", "uk", "ja"]);
});

test("the kept form is one of the three, or interleaved", () => {
  expect(keptForm("side")).toBe("side");
  expect(keptForm("reveal")).toBe("reveal");
  expect(keptForm(null)).toBe("interleaved");
  expect(keptForm("columns")).toBe("interleaved");
});

test("the speakers whose errors show are the page's language and the kept list's, written in the topic or not", () => {
  expect(readerSpeakers("uk", null)).toEqual(["uk"]);
  expect(readerSpeakers("uk", "es uk pt fr")).toEqual(["uk", "es", "pt"]);
});
