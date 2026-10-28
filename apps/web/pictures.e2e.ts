// The pictures drawn in a browser with each theme's colours from tokens.json: the figure shows in every scene in light and
// dark, a place hides what its words hide, and every cell of the words-of-place sample shows its figure.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { exportLibrary } from "../../scripts/export.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { shared } from "./browser.ts";
import { type Ground, GROUNDS, type Place, places, primitive, scene, sceneGrid } from "./pictures.ts";
import { wordsOfPlace } from "./pictures-sample.ts";
import { type Theme, token } from "./tokens.ts";

const { browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage();
}, SLOW);
afterAll(async () => {
  await page.close();
});

const SCENES: [Place, Ground][] = places.flatMap((p) => GROUNDS[p].map((g): [Place, Ground] => [p, g]));

// The pixels of the accent colour in each svg drawn 192 px wide with a theme's colours in place of the variables.
async function accent(svgs: string[], theme: Theme): Promise<number[]> {
  const drawn = svgs.map((svg) =>
    svg
      .replace(/ width="[^"]*" height="[^"]*"/, "")
      .replace("<svg ", '<svg width="192" height="192" ')
      .replace(/var\(--c-([a-z]+)\)/g, (_, name: string) => token(name, theme)),
  );
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(token("accent", theme).slice(at, at + 2), 16));
  return page.evaluate(
    async ({ svgs: sources, rgb: [r0, g0, b0] }) =>
      Promise.all(
        sources.map(async (svg) => {
          const image = new Image(192, 192);
          image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
          await image.decode();
          const canvas = new OffscreenCanvas(192, 192);
          const context = canvas.getContext("2d");
          if (context === null) return 0;
          context.drawImage(image, 0, 0, 192, 192);
          const px = context.getImageData(0, 0, 192, 192).data;
          let count = 0;
          for (let i = 0; i < px.length; i += 4) {
            if (Math.abs((px[i] ?? 0) - r0) < 8 && Math.abs((px[i + 1] ?? 0) - g0) < 8 && Math.abs((px[i + 2] ?? 0) - b0) < 8) {
              count++;
            }
          }
          return count;
        }),
      ),
    { svgs: drawn, rgb: [r ?? 0, g ?? 0, b ?? 0] as const },
  );
}

test(
  "the figure shows in every scene, in light and dark, and the ball alone fills its cell's middle",
  async () => {
    for (const theme of ["light", "dark"] as const) {
      const counts = await accent(
        SCENES.map(([place, ground]) => scene(place, { ground })),
        theme,
      );
      counts.forEach((n, i) => {
        expect(n, `${SCENES[i]?.join(" on ") ?? ""}, ${theme}`).toBeGreaterThan(40);
      });
    }
    expect((await accent([primitive("ball")], "light"))[0]).toBeGreaterThan(300);
  },
  SLOW,
);

test(
  "a place hides what its words hide, and in front of covers the ground, never the ball",
  async () => {
    const [whole = 0, front = 0, ...hidden] = await accent(
      [
        scene("on-surface", { ground: "box" }),
        scene("front", { ground: "box" }),
        scene("contained", { ground: "box" }),
        scene("back", { ground: "box" }),
        scene("under-covered", { ground: "cover" }),
      ],
      "light",
    );
    for (const shown of hidden) {
      expect(shown).toBeGreaterThan(40);
      expect(shown).toBeLessThan(whole * 0.9);
    }
    expect(front).toBeGreaterThan(whole * 0.95);
  },
  SLOW,
);

test(
  "every cell of the words-of-place sample shows its figure",
  async () => {
    const html = sceneGrid(wordsOfPlace(await exportLibrary({ library: "v1", root: SAMPLES_ROOT, drafts: true })));
    const svgs = html.match(/<svg [\s\S]*?<\/svg>/g) ?? [];
    expect(svgs).toHaveLength(15);
    for (const n of await accent(svgs, "light")) expect(n).toBeGreaterThan(40);
  },
  SLOW,
);
