// Writes the built site: every page, the sitemap and the assets, swapped in place at once.
import { mkdir, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { clientJs, levelsCss, styleCss, varietiesCss } from "./assets.ts";
import type { BuildOptions, Page } from "./context.ts";

// What a page must never show: Markdown, a topic link or an object the renderer left unrendered.
const LEFTOVERS = ["**", "](id:", "undefined", "[object Object]"];

// The leftovers a page or data file holds, each with the text around it.
export function leftovers(text: string): string[] {
  return LEFTOVERS.flatMap((s) => {
    const at = text.indexOf(s);
    return at < 0 ? [] : [`${s} in "…${text.slice(Math.max(0, at - 40), at + s.length + 20)}…"`];
  });
}

// varieties: the varieties of each language being learned that has them. A page that holds a leftover stops
// the build, naming it.
export async function writeSite(pages: Page[], o: BuildOptions, varieties: readonly (readonly string[])[] = []): Promise<void> {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .filter((p) => p.sitemap)
  .map((p) => `  <url><loc>${o.siteUrl}${p.path}</loc></url>`)
  .join("\n")}
</urlset>
`;

  const left = pages.flatMap((p) => leftovers(p.html).map((l) => `${p.path}: ${l}`));
  if (left.length > 0) throw new Error(`${String(left.length)} leftovers in the built pages:\n${left.slice(0, 10).join("\n")}`);

  // Write into a fresh folder, then swap it in place.
  const tmp = `${o.outDir}.tmp`;
  const old = `${o.outDir}.old`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  for (const p of pages) {
    const file = p.path.endsWith("/") ? join(tmp, p.path, "index.html") : join(tmp, p.path);
    await Bun.write(file, p.html);
  }
  await Bun.write(join(tmp, "sitemap.xml"), sitemap);
  await Bun.write(join(tmp, "style.css"), await styleCss());
  await Bun.write(join(tmp, "levels.css"), levelsCss() + varietiesCss(varieties));
  await Bun.write(join(tmp, "client.js"), await clientJs());
  await rm(old, { recursive: true, force: true });
  await rename(o.outDir, old).catch(() => {
    // No earlier build to move aside.
  });
  await rename(tmp, o.outDir);
  await rm(old, { recursive: true, force: true });
}
