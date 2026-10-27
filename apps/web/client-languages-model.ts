// The reader's languages as pure rules, shared by the languages page and every page that writes them in: the stored
// list (ln-langs, codes separated by spaces, at most three), the list a browser's preferred languages make, and the
// language a course or a topic resolves to.
export const LANGS_KEY = "ln-langs";
export const MAX_LANGS = 3;
export const pinKey = (course: string): string => `ln-xl-${course}`;

// The codes of a stored list that are enabled, each once, at most three.
export function parseList(raw: string | null, enabled: readonly string[]): string[] {
  const kept = (raw ?? "").split(" ").filter((code, i, all) => enabled.includes(code) && all.indexOf(code) === i);
  return kept.slice(0, MAX_LANGS);
}

// The enabled languages among a browser's preferred languages, in its order ("uk-UA" is "uk"); with none, the
// language given.
export function fromBrowser(tags: readonly string[], enabled: readonly string[], fallback: string): string[] {
  const codes = tags.map((tag) => tag.slice(0, 2).toLowerCase());
  const list = parseList(codes.join(" "), enabled);
  return list.length > 0 ? list : [fallback];
}

// How a course resolves: "first" is the reader's first language, "fallback" a later one, "pinned" the one the reader
// chose for this course, "none" a course with none of the reader's languages, which names its source language.
export interface Resolved {
  lang: string;
  via: "first" | "fallback" | "pinned" | "none";
}

// The explanation languages of a course, source first.
export function resolveCourse(explains: readonly string[], list: readonly string[], pin: string | null): Resolved {
  if (pin !== null && explains.includes(pin)) return { lang: pin, via: "pinned" };
  const found = list.find((code) => explains.includes(code));
  if (found !== undefined) return { lang: found, via: found === list[0] ? "first" : "fallback" };
  return { lang: explains[0] ?? "", via: "none" };
}

// The language a topic is read in: the course's pinned language, then the reader's languages in order, the first the
// topic has; null when it has none of them.
export function resolveTopic(has: readonly string[], list: readonly string[], pin: string | null): string | null {
  return [...(pin === null ? [] : [pin]), ...list].find((code) => has.includes(code)) ?? null;
}

// A template of the interface file with its {name} and {name:lower} placeholders filled.
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)(:lower)?\}/g, (_match, name: string, lower: string | undefined) => {
    const value = values[name] ?? `{${name}}`;
    return lower === undefined ? value : value.toLowerCase();
  });
}

// A template split around its {language} placeholder, the name lowercased where the placeholder says :lower.
export function aroundName(template: string, name: string): [string, string, string] {
  const match = /\{language(:lower)?\}/.exec(template);
  if (match === null) return [template, "", ""];
  return [
    template.slice(0, match.index),
    match[1] === undefined ? name : name.toLowerCase(),
    template.slice(match.index + match[0].length),
  ];
}

// An address in another explanation language: its first segment is the language's code.
export const inLanguage = (path: string, code: string): string => path.replace(/^\/[a-z]{2}\//, `/${code}/`);

// A path inside the site, to go back to after the first run; anything else is not one.
export const backPath = (raw: string | null): string | null => (raw !== null && /^\/(?!\/)[^\\\s]*$/.test(raw) ? raw : null);
