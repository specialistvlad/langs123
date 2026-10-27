// What a page needs to write the reader's languages into itself, in the page's language (pages/languages-data.ts), read
// once from /{language}/languages.json.
import { fromBrowser, LANGS_KEY, parseList } from "./client-languages-model.ts";
import { store } from "./client-store.ts";

export interface LanguageEntry {
  code: string;
  own: string;
  named: string;
  home: string;
  page: string;
  firstRun: string;
}
export interface LanguagesText {
  lang: string;
  languages: LanguageEntry[];
  courses: Record<string, { flag: string; name: string }>;
  words: Record<string, string>;
}

export async function loadText(lang: string): Promise<LanguagesText | null> {
  try {
    const answer = await fetch(`/${lang}/languages.json`);
    return answer.ok ? ((await answer.json()) as LanguagesText) : null;
  } catch {
    return null;
  }
}

export const codesOf = (text: LanguagesText): string[] => text.languages.map((l) => l.code);

// The reader's list; before the reader has chosen, the one their browser's languages make.
export function readerList(enabled: readonly string[], fallback: string): string[] {
  const stored = parseList(store.get(LANGS_KEY), enabled);
  return stored.length > 0 ? stored : fromBrowser(navigator.languages, enabled, fallback);
}

// The names of the reader's languages, as the Home's menu lists them under Languages I know.
export const ownNames = (text: LanguagesText, list: readonly string[]): string =>
  list.map((code) => text.languages.find((l) => l.code === code)?.own ?? code).join(", ");
