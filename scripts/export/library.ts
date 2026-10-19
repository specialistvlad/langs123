// The library as library.json holds it (scripts/export.ts writes it): configuration, languages and topics.
import { levelColours, linearRgb, type Oklch } from "../../apps/web/level-colours.ts";
import { topicTitle } from "../content.ts";
import { explainOf, INTERFACE, LEVEL_INFO, LEVELS, loadCurriculum, loadTopics, ROOT, sectionSlug, SITE } from "../lib.ts";
import { varietyName } from "../text.ts";
import { topic } from "./blocks.ts";
import { inTrack, localized } from "./text.ts";
import type { LevelTones, Library } from "./types.ts";

// the level's code, tint lies behind it, strong lies behind the chosen level in the switcher.
const hex = (colour: Oklch): string =>
  "#" +
  linearRgb(colour)
    .map((v) => {
      const c = Math.min(1, Math.max(0, v));
      const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
      return Math.round(encoded * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
function tones(theme: "light" | "dark", code: string): LevelTones {
  const t = levelColours(theme)[code];
  if (t === undefined) throw new Error(`No ${theme} colours for level ${code}`);
  return { ink: hex(t.ink), tint: hex(t.tint), strong: hex(t.strong) };
}

// The whole library: configuration every reader shares (site, credit and licences, explanation languages,
// level scale, interface wording), the languages being learned with their sections and study path, and
// every written topic by id.
export async function exportLibrary(): Promise<Library> {
  const curriculum = await loadCurriculum();
  const refs = await loadTopics(curriculum);
  const commit = Bun.spawnSync(["git", "-C", ROOT, "rev-parse", "--short", "HEAD"]).stdout.toString().trim();
  return {
    source: { commit },
    site: {
      name: SITE.name,
      url: SITE.url,
      repository: SITE.repository,
      credit: SITE.credit,
      licences: SITE.licences,
      explain: SITE.explain,
    },
    levels: LEVEL_INFO.map((l) => ({
      code: l.code,
      name: l.name,
      description: l.description,
      colors: { light: tones("light", l.code), dark: tones("dark", l.code) },
    })),
    interface: INTERFACE,
    languages: curriculum.languages.map((lang) => ({
      code: lang.code,
      enabled: lang.enabled,
      slug: lang.slug,
      name: lang.name,
      // The explanation languages the course is written for, the source first, and the varieties a reader
      // chooses between, the default first.
      explain: explainOf(lang),
      varieties: lang.varieties?.map((v) => ({ code: v, name: Object.fromEntries(explainOf(lang).map((e) => [e, varietyName(v, e)])) })),
      // Topics by category, the Categories grouping.
      sections: lang.sections.map((section) => ({
        slug: sectionSlug(section.dir),
        number: section.dir.slice(0, 2),
        title: section.title,
        topics: refs
          .filter((r) => r.lang === lang.code && r.section === section)
          .map((r) => ({
            id: r.id,
            slug: r.entry.slug,
            // The planned range of a topic without data; a written topic takes its range from its leaves.
            levels: r.topic === null ? r.entry.levels : undefined,
            title: Object.fromEntries(r.explain.map((e) => [e, topicTitle(r, e)])),
            lead: r.topic ? inTrack(lang, () => localized(r.topic?.summary.lead)) : undefined,
            available: r.topic !== null,
          })),
      })),
      // The study path, the By level grouping: per level, lowest first, the topics to study at it.
      path: LEVELS.flatMap((level) => {
        const topics = lang.path[level];
        return topics === undefined ? [] : [{ level, topics }];
      }),
    })),
    topics: Object.fromEntries(
      refs.flatMap((r) => {
        const lang = curriculum.languages.find((l) => l.code === r.lang);
        const written = r.topic;
        return written !== null && lang !== undefined ? [[r.id, inTrack(lang, () => topic(written, r.path))]] : [];
      }),
    ),
  };
}
