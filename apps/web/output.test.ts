// A page with unrendered text stops the build.
import { expect, test } from "bun:test";
import { leftovers } from "./output.ts";

test("leftovers name each piece of unrendered text a page holds, and none in a clean page", () => {
  expect(leftovers("<p>a **bold** [b](id:x) undefined [object Object]</p>").map((l) => l.split(" in ")[0])).toEqual([
    "**",
    "](id:",
    "undefined",
    "[object Object]",
  ]);
  expect(leftovers("<!doctype html><html><head><title>t</title></head><body></body></html>")).toEqual([]);
});
