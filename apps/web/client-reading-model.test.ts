// The reading's choices: the reader's languages for a topic, the page's first and the kept list's that the topic has after
// it, three at most; and the kept form, interleaved when the browser keeps none or one it no longer knows.
import { expect, test } from "bun:test";
import { keptForm, readerLanguages, readerSpeakers } from "./client-reading-model.ts";

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
