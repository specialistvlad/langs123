// A build's brand option brings the product's own lines: its mark on the Home and the credits, and on the
// credits its tagline, version line, rows and closing line; a build without one shows the library's own.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { ROOT } from "../../scripts/lib.ts";
import { build } from "./build.ts";
import { SAMPLE } from "./sample.ts";
import { readPage } from "./test-site.ts";

const out = join(ROOT, "build", "test", "brand");
await build({
  outDir: out,
  dev: false,
  siteUrl: "http://127.0.0.1",
  sample: { topics: SAMPLE.topics.slice(0, 1), explain: ["en"] },
  brand: {
    mark: (size) => `<svg class="product-mark" width="${String(size)}"></svg>`,
    credits: {
      tagline: (e) => `Tagline ${e}`,
      version: () => "Version 1.2.3",
      rows: () => [{ glyph: "mail", title: "Support", value: "help@example.org", href: "mailto:help@example.org" }],
      footer: (e) => `Made in ${e}`,
    },
  },
});
const page = async (path: string): Promise<Document> => parseHTML(await Bun.file(join(out, path)).text()).document;

test("the product's mark and credits lines replace the library's own", async () => {
  expect((await page("index.html")).querySelector(".hm-brand .product-mark")).not.toBeNull();
  const credits = await page("uk/credits/index.html");
  expect(credits.querySelector(".cr-mark .product-mark")?.getAttribute("width")).toBe("64");
  expect(credits.querySelector(".cr-tag")?.textContent).toBe("Tagline uk");
  expect(credits.querySelector(".cr-version")?.textContent).toBe("Version 1.2.3");
  expect([...credits.querySelectorAll(".cr-links .cr-row")].map((a) => a.getAttribute("href"))).toEqual([
    "https://langs123.com",
    "mailto:help@example.org",
  ]);
  expect(credits.querySelector(".cr-made")?.textContent).toBe("Made in uk");
});

test("without a brand the credits show the library's mark, its heading as the tagline, and no version or closing line", async () => {
  const credits = await readPage("credits/index.html");
  expect(credits.querySelector(".cr-mark svg text")?.textContent).toBe("123");
  expect(credits.querySelector(".cr-version")).toBeNull();
  expect(credits.querySelector(".cr-made")).toBeNull();
  expect(credits.querySelectorAll(".cr-links .cr-row")).toHaveLength(1);
});
