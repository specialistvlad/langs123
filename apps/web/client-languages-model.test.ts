// The reader's languages as pure rules (client-languages-model.ts).
import { describe, expect, test } from "bun:test";
import {
  aroundName,
  backPath,
  fill,
  fromBrowser,
  inLanguage,
  parseList,
  pinKey,
  resolveCourse,
  resolveTopic,
} from "./client-languages-model.ts";

const ENABLED = ["en", "uk", "es", "pl"];

describe("the list", () => {
  test("a stored list keeps the enabled languages, each once, at most three", () => {
    expect(parseList("uk en pl", ENABLED)).toEqual(["uk", "en", "pl"]);
    expect(parseList("uk xx uk en es pl", ENABLED)).toEqual(["uk", "en", "es"]);
    expect(parseList(null, ENABLED)).toEqual([]);
    expect(parseList("", ENABLED)).toEqual([]);
  });

  test("the browser's languages make the list, a region dropped, the unknown left out", () => {
    expect(fromBrowser(["uk-UA", "en-GB", "ko", "PL"], ENABLED, "en")).toEqual(["uk", "en", "pl"]);
    expect(fromBrowser(["en-US", "uk", "en", "es", "pl"], ENABLED, "en")).toEqual(["en", "uk", "es"]);
  });

  test("with none of them enabled the list holds the language given", () => {
    expect(fromBrowser(["ko-KR"], ENABLED, "uk")).toEqual(["uk"]);
    expect(fromBrowser([], ENABLED, "uk")).toEqual(["uk"]);
  });

  test("a course's pin is kept under its own key", () => {
    expect(pinKey("en")).toBe("ln-xl-en");
  });
});

describe("a course", () => {
  test("uses the first language of the list that it has", () => {
    expect(resolveCourse(["en", "uk"], ["uk", "en"], null)).toEqual({ lang: "uk", via: "first" });
    expect(resolveCourse(["en", "es"], ["uk", "en", "pl"], null)).toEqual({ lang: "en", via: "fallback" });
  });

  test("uses its pinned language when it has it, the list when it does not", () => {
    expect(resolveCourse(["en", "es"], ["uk", "en"], "es")).toEqual({ lang: "es", via: "pinned" });
    expect(resolveCourse(["en", "es"], ["uk", "en"], "pt")).toEqual({ lang: "en", via: "fallback" });
  });

  test("with none of the reader's languages names its source language", () => {
    expect(resolveCourse(["ja"], ["uk", "en"], null)).toEqual({ lang: "ja", via: "none" });
    expect(resolveCourse([], ["uk"], null)).toEqual({ lang: "", via: "none" });
  });
});

describe("a topic", () => {
  test("is read in the pinned language, then the first of the list that it has", () => {
    expect(resolveTopic(["en", "uk"], ["uk", "en"], null)).toBe("uk");
    expect(resolveTopic(["en"], ["uk", "en", "pl"], null)).toBe("en");
    expect(resolveTopic(["en", "es"], ["uk", "en"], "es")).toBe("es");
    expect(resolveTopic(["en"], ["uk", "en"], "es")).toBe("en");
  });

  test("with none of the reader's languages has no language of its own", () => {
    expect(resolveTopic(["ja"], ["uk", "en"], null)).toBeNull();
  });
});

describe("the wording and the addresses", () => {
  test("a template's placeholders take their values, {name:lower} lowercased", () => {
    expect(fill("Now: {language}", { language: "English" })).toBe("Now: English");
    expect(fill("Es {language:lower}, {fallback}", { language: "Español", fallback: "X" })).toBe("Es español, X");
    expect(fill("{missing}", {})).toBe("{missing}");
  });

  test("a template splits around its language, the name lowercased where the placeholder says so", () => {
    expect(aroundName("Explained in: {language}", "English")).toEqual(["Explained in: ", "English", ""]);
    expect(aroundName("Мова пояснень: {language:lower}!", "Українська")).toEqual(["Мова пояснень: ", "українська", "!"]);
    expect(aroundName("No placeholder", "English")).toEqual(["No placeholder", "", ""]);
  });

  test("an address changes its explanation language", () => {
    expect(inLanguage("/uk/english/", "en")).toBe("/en/english/");
    expect(inLanguage("/uk/english/a/b/", "es")).toBe("/es/english/a/b/");
  });

  test("the first run goes back to a path inside the site and nowhere else", () => {
    expect(backPath("/uk/english/?level=a1#x")).toBe("/uk/english/?level=a1#x");
    expect(backPath("/")).toBe("/");
    for (const bad of [null, "", "//evil.example/", "https://evil.example/", "/\\evil", "/a b"]) expect(backPath(bad)).toBeNull();
  });
});
