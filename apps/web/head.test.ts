// A page's head comes from its options, changed by the build's head option: the facts the option reads
// name the page, and the change it returns sets the title, description, canonical address, alternates,
// Open Graph type and extra tags.
import { expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { page, pageFacts, type PageInput } from "./layout.ts";

const input: PageInput = {
  kind: "topic",
  lang: "uk",
  title: "Числа — Англійська",
  description: "Кількісні й порядкові числівники.",
  path: "/uk/english/foundations/numbers/",
  alternates: [
    { lang: "en", path: "/en/english/foundations/numbers/" },
    { lang: "uk", path: "/uk/english/foundations/numbers/" },
  ],
  about: { name: "Числа", lang: "en", topic: "en.foundations.numbers", minutes: 4 },
  body: "<article></article>",
};
const built = (change = {}): Document => parseHTML(page({ ...input, dev: false, siteUrl: "https://example.org" }, change)).document;
const attr = (doc: Document, selector: string, name: string): string | null | undefined => doc.querySelector(selector)?.getAttribute(name);

test("a page's facts name it and list its alternates with x-default after them", () => {
  expect(pageFacts(input, true)).toEqual({
    path: "/uk/english/foundations/numbers/",
    kind: "topic",
    explain: "uk",
    title: "Числа — Англійська",
    description: "Кількісні й порядкові числівники.",
    alternates: [...(input.alternates ?? []), { lang: "x-default", path: "/en/english/foundations/numbers/" }],
    sitemap: true,
    name: "Числа",
    lang: "en",
    topic: "en.foundations.numbers",
    minutes: 4,
  });
});

test("without a change the head holds the page's own title, description and address", () => {
  const doc = built();
  expect(doc.title).toBe("Числа — Англійська");
  expect(attr(doc, 'meta[name="description"]', "content")).toBe("Кількісні й порядкові числівники.");
  expect(attr(doc, 'link[rel="canonical"]', "href")).toBe("https://example.org/uk/english/foundations/numbers/");
  expect(attr(doc, 'meta[property="og:type"]', "content")).toBe("website");
  expect(doc.querySelectorAll('link[rel="alternate"]').length).toBe(3);
});

test("a change sets the title, description, canonical address, type and tags, and can drop the alternates", () => {
  const doc = built({
    title: "Числа англійською | Site",
    description: "Інший опис.",
    canonical: "/uk/english/",
    alternates: false,
    type: "article",
    tags: ['<meta name="robots" content="noindex, follow">', '<link rel="icon" href="/icon.svg">'],
  });
  expect(doc.title).toBe("Числа англійською | Site");
  expect(attr(doc, 'meta[property="og:title"]', "content")).toBe("Числа англійською | Site");
  expect(attr(doc, 'meta[property="og:description"]', "content")).toBe("Інший опис.");
  expect(attr(doc, 'link[rel="canonical"]', "href")).toBe("https://example.org/uk/english/");
  expect(attr(doc, 'meta[property="og:url"]', "content")).toBe("https://example.org/uk/english/");
  expect(attr(doc, 'meta[property="og:type"]', "content")).toBe("article");
  expect(doc.querySelectorAll('link[rel="alternate"]').length).toBe(0);
  expect(attr(doc, 'meta[name="robots"]', "content")).toBe("noindex, follow");
  expect(attr(doc, 'link[rel="icon"]', "href")).toBe("/icon.svg");
});
