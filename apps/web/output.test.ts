// A page with unrendered text stops the build; an asset is also written under a name carrying its content's hash.
import { expect, test } from "bun:test";
import { hashed, leftovers } from "./output.ts";

test("leftovers name each piece of unrendered text a page holds, and none in a clean page", () => {
  expect(leftovers("<p>a **bold** [b](id:x) undefined [object Object]</p>").map((l) => l.split(" in ")[0])).toEqual([
    "**",
    "](id:",
    "undefined",
    "[object Object]",
  ]);
  expect(leftovers("<!doctype html><html><head><title>t</title></head><body></body></html>")).toEqual([]);
});

test("an asset's hashed name carries ten hex digits of its content's hash, the same for the same content", () => {
  expect(hashed("style.css", "a")).toMatch(/^style\.[0-9a-f]{10}\.css$/);
  expect(hashed("client.js", "a")).toMatch(/^client\.[0-9a-f]{10}\.js$/);
  expect(hashed("style.css", "a")).toBe(hashed("style.css", "a"));
  expect(hashed("style.css", "a")).not.toBe(hashed("style.css", "b"));
});
