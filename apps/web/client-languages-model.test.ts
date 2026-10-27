// The reader's languages as pure rules (client-languages-model.ts).
import { describe, expect, test } from "bun:test";
import {
  automated,
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

describe("the first visit's redirect", () => {
  const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";
  const ANDROID = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36";
  const chrome = [{ brand: "Chromium" }, { brand: "Google Chrome" }, { brand: "Not_A Brand" }];

  test("crawlers and Google's inspection tool skip it, by the names in their user agents", () => {
    for (const ua of [
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/153.0.0.0 Safari/537.36",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36",
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)",
      "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)",
      `${ANDROID} Chrome-Lighthouse`,
    ]) {
      expect(automated(ua, undefined)).toBe(true);
    }
  });

  test("PageSpeed skips it: its phone by name, and on both form factors the brands Lighthouse gives the browser", () => {
    const lighthouse = [{ brand: "Chromium" }, { brand: "Google Chrome" }];
    const phone =
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36";
    expect([automated(phone, undefined), automated(phone, lighthouse), automated(CHROME, lighthouse)]).toEqual([true, true, true]);
  });

  test("readers keep it: Chrome with its decoy brand, the same phone in an app's web view, Safari and Firefox without brands", () => {
    const webView =
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022) Build/RRQS31.Q3-68-16-2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/153.0.0.0 Mobile Safari/537.36";
    expect([automated(CHROME, chrome), automated(ANDROID, chrome), automated(webView, chrome)]).toEqual([false, false, false]);
    expect(automated(CHROME, [])).toBe(false);
    for (const ua of [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0",
    ]) {
      expect(automated(ua, undefined)).toBe(false);
    }
  });
});
