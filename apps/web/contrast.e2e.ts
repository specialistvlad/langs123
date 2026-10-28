// M8's gate check 3 in a browser: every text of each page kind, the v1 reading and the review preview among them, against
// its effective ground (the backgrounds behind it composited, the opacities applied) in each design and theme, at 4.5:1,
// or 3:1 at 24 px and up or 18.7 px bold. Text of symbols alone (joiners, slashes, arrows) is decoration and stays out.
// Today's design holds the findings contrast-baseline.json records, no more; every other design but the proof, which
// exists for the swap's test, holds none.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { shared } from "./browser.ts";
import { build } from "./build.ts";
import baseline from "./contrast-baseline.json";
import { SAMPLE } from "./sample.ts";
import { served } from "./serve.ts";
import { SITE_DIR } from "./test-site.ts";
import { DEFAULT_DESIGN, DESIGNS } from "./tokens.ts";

const PAGES = [
  "/",
  "/uk/",
  "/en/english/",
  "/en/english/tenses/simple-tenses/",
  "/uk/english/tenses/simple-tenses/",
  "/credits/",
  "/languages/",
  "/404.html",
  "/uk/english/v1/present-simple/",
  "/uk/english/v1/words-of-place/",
  "/uk/spanish/v1/subject-pronouns/",
  "/review/",
  "/review/es.subject-pronouns/?lang=uk",
];
const SLOW = 120_000;
const { browser } = await shared();
const servers: { stop: (now: boolean) => Promise<void> }[] = [];
afterAll(async () => {
  for (const s of servers) await s.stop(true);
});

// A design's site, built as a v1 preview builds it, and served.
async function site(design: string): Promise<URL> {
  const dir = `${SITE_DIR}-contrast-${design}`;
  await build({ outDir: dir, dev: true, siteUrl: "http://127.0.0.1", sample: SAMPLE, library: "v1", root: SAMPLES_ROOT, design });
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (req) => {
      const answer = await served(dir, decodeURIComponent(new URL(req.url).pathname));
      if (answer.status === 301) return new Response(null, { status: 301, headers: { Location: answer.location } });
      return new Response(Bun.file(answer.file), { status: answer.status });
    },
  });
  servers.push(server);
  return server.url;
}

// The texts of the page under the line, each as theme|selector|colour|ground with its ratio.
async function findings(page: Page): Promise<{ key: string; ratio: number }[]> {
  return page.evaluate(() => {
    const parse = (c: string): number[] => {
      const srgb = /color\(srgb ([^)]+)\)/.exec(c);
      if (srgb) {
        const p = (srgb[1] ?? "").split(/[ /]+/).filter(Boolean).map(Number);
        return [(p[0] ?? 0) * 255, (p[1] ?? 0) * 255, (p[2] ?? 0) * 255, p[3] ?? 1];
      }
      const p = (/rgba?\(([^)]+)\)/.exec(c)?.[1] ?? "0 0 0 0")
        .split(/[ ,/]+/)
        .filter(Boolean)
        .map(Number);
      return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, p[3] ?? 1];
    };
    const over = (top: number[], bottom: number[]): number[] => {
      const a = top[3] ?? 1;
      return [0, 1, 2].map((i) => (top[i] ?? 0) * a + (bottom[i] ?? 0) * (1 - a)).concat(1);
    };
    const lum = (c: number[]): number => {
      const f = (v: number): number => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(c[0] ?? 0) + 0.7152 * f(c[1] ?? 0) + 0.0722 * f(c[2] ?? 0);
    };
    const hex = (c: number[]): string =>
      `#${c
        .slice(0, 3)
        .map((v) => Math.round(v).toString(16).padStart(2, "0"))
        .join("")}`;
    const out: { key: string; ratio: number }[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const text = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? "")
        .join("")
        .trim();
      if (
        !/[\p{L}\p{N}]/u.test(text) ||
        el.closest("[aria-hidden=true], [hidden], script, style, noscript, template, dialog:not([open])")
      ) {
        continue;
      }
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (box.width === 0 || box.height === 0 || style.visibility !== "visible") continue;
      let alpha = 1;
      let image = false;
      const grounds: number[][] = [];
      for (let a: HTMLElement | null = el; a; a = a.parentElement) {
        const s = getComputedStyle(a);
        alpha *= Number(s.opacity);
        if (s.backgroundImage !== "none") image = true;
        const b = parse(s.backgroundColor);
        if ((b[3] ?? 0) > 0) grounds.push(b);
        if (b[3] === 1) break;
      }
      if (image) continue;
      const ground = grounds.reverse().reduce((g, b) => over(b, g), [255, 255, 255, 1]);
      const fg = parse(style.color);
      fg[3] = (fg[3] ?? 1) * alpha;
      const [hi = 0, lo = 0] = [lum(over(fg, ground)), lum(ground)].sort((x, y) => y - x);
      const ratio = (hi + 0.05) / (lo + 0.05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      const selector = `${el.tagName.toLowerCase()}${el.classList.length > 0 ? `.${Array.from(el.classList).slice(0, 2).join(".")}` : ""}`;
      if (ratio < (large ? 3 : 4.5)) out.push({ key: `${selector}|${style.color}|${hex(ground)}`, ratio: Math.round(ratio * 100) / 100 });
    }
    return out;
  });
}

// Every finding of a design's pages, by theme, each key once with its lowest ratio.
async function audit(design: string): Promise<Record<string, number>> {
  const base = await site(design);
  const found: Record<string, number> = {};
  for (const theme of ["light", "dark"] as const) {
    for (const width of [402, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
      for (const path of PAGES) {
        await page.goto(new URL(path, base).href, { waitUntil: "load" });
        await page.waitForTimeout(100);
        for (const f of await findings(page)) {
          const key = `${theme}|${f.key}`;
          found[key] = Math.min(found[key] ?? Infinity, f.ratio);
        }
      }
      await page.close();
    }
  }
  return found;
}

test(
  "today's design holds the findings its baseline records, and none more",
  async () => {
    const found = await audit(DEFAULT_DESIGN);
    if (process.env["CONTRAST_WRITE"] === "1") {
      await Bun.write(`${import.meta.dir}/contrast-baseline.json`, `${JSON.stringify(found, null, 2)}\n`);
    }
    expect(
      Object.keys(found)
        .filter((k) => !(k in baseline))
        .sort(),
    ).toEqual([]);
  },
  SLOW,
);

test(
  "every other design but the proof holds no finding",
  async () => {
    for (const design of DESIGNS.filter((d) => d !== DEFAULT_DESIGN && d !== "proof")) expect(await audit(design), design).toEqual({});
  },
  SLOW,
);
