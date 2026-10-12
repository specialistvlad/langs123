// Clean, stable, named URLs (languages/CONVENTIONS.md §10). Every URL ends with "/".
import { ENABLED_EXPLAIN, type Explain, LEVELS, sectionSlug, type TopicRef } from "../../scripts/lib.ts";

interface LangSlug {
  slug: string;
}

// The first explanation language speaks at the root; every other one under its code.
const root = (explain: Explain): string => (explain === ENABLED_EXPLAIN[0] ? "/" : `/${explain}/`);
export const homeUrl = (explain: Explain): string => root(explain);
export const creditsUrl = (explain: Explain): string => `${root(explain)}credits/`;
export const notFoundUrl = (explain: Explain): string => `${root(explain)}404.html`;
export const trackUrl = (explain: Explain, lang: LangSlug): string => `/${explain}/${lang.slug}/`;
export const topicUrl = (explain: Explain, lang: LangSlug, ref: TopicRef): string =>
  `${trackUrl(explain, lang)}${sectionSlug(ref.section.dir)}/${ref.entry.slug}/`;
export const sheetsUrl = (explain: Explain, lang: LangSlug): string => `${trackUrl(explain, lang)}cheatsheets/`;
export const sheetUrl = (explain: Explain, lang: LangSlug, sheet: string): string => `${sheetsUrl(explain, lang)}${sheet}/`;

// Sheet identifiers inside a track.
export const levelSheet = (level: string): string => level.toLowerCase();
export const progressiveSheet = (level: string): string => `${LEVELS[0]}-${level}`.toLowerCase();
export const sectionSheet = (ref: Pick<TopicRef, "section">): string => sectionSlug(ref.section.dir);
export const topicSheet = (ref: TopicRef): string => `${sectionSlug(ref.section.dir)}/${ref.entry.slug}`;
