// The shape of library.json (languages/schema/library.schema.json), as the export writes it.
import type { CurriculumLanguage, Explain, Interface, Localized, Site } from "../lib.ts";

// Text keyed by explanation language, `uk`, or by explanation language and variety, `uk@es-ES`, where the
// varieties read differently.
export type Keyed = Record<string, string>;
type Maybe<T> = T | undefined;

export interface LibraryItem {
  text: Maybe<Keyed>;
  body: Maybe<Keyed>;
  label: Maybe<Keyed>;
  ex: Maybe<string | Keyed>;
  tr: Maybe<Keyed>;
  level: string;
  variety: Maybe<string>;
  kind: Maybe<"rule" | "note" | "example">;
  for: Maybe<Explain[]>;
}
export interface LibraryColumn {
  key: string;
  slot?: Maybe<string>;
  label: string | Keyed;
  group?: Maybe<Keyed>;
  merge?: boolean;
  center?: boolean;
  for: Maybe<Explain[]>;
}
export type LibraryCell = Record<string, never> | { ex: Maybe<string | Keyed>; tr: Maybe<Keyed> } | { text: Maybe<string | Keyed> };
export interface LibraryRow {
  level: string;
  tr: Maybe<Keyed>;
  variety: Maybe<string>;
  for: Maybe<Explain[]>;
  cells: LibraryCell[];
}
export interface LibraryErrorRow {
  level: string;
  wrong: Maybe<string | Keyed>;
  right: Maybe<string | Keyed>;
  rule: Maybe<Keyed>;
  for: Maybe<Explain[]>;
}
export type TableType = "paradigm" | "usage" | "comparison" | "inventory";
export type LibraryBlock =
  | { type: "prose"; item: LibraryItem }
  | { type: "list"; items: LibraryItem[]; for: Maybe<Explain[]> }
  | { type: TableType; columns: LibraryColumn[]; rows: LibraryRow[]; for: Maybe<Explain[]> }
  | { type: "errors"; rows: LibraryErrorRow[]; for: Maybe<Explain[]> };
export interface LibraryTopic {
  id: string;
  lang: string;
  kind: string;
  // The topic's file in the repository, which an Edit link opens.
  path: string;
  minutes: Record<string, number>;
  title: Maybe<Keyed>;
  summary: Keyed;
  lead: Maybe<Keyed>;
  cheatsheet: LibraryBlock[];
  sections: { title: Maybe<Keyed>; for: Maybe<Explain[]>; blocks: LibraryBlock[] }[];
}
export interface LevelTones {
  ink: string;
  tint: string;
  strong: string;
  pill: string;
  pillInk: string;
}
export interface Library {
  source: { commit: string };
  site: Pick<Site, "name" | "url" | "repository" | "credit" | "licences" | "explain">;
  levels: { code: string; name: Localized; description: Localized; colors: { light: LevelTones; dark: LevelTones } }[];
  interface: Interface;
  languages: {
    code: string;
    enabled: boolean;
    slug: string;
    name: CurriculumLanguage["name"];
    explain: Explain[];
    varieties: Maybe<{ code: string; name: Keyed }[]>;
    sections: {
      slug: string;
      number: string;
      title: CurriculumLanguage["sections"][number]["title"];
      topics: { id: string; slug: string; levels: Maybe<string>; title: Keyed; lead: Maybe<Keyed>; available: boolean }[];
    }[];
    path: { level: string; topics: string[] }[];
  }[];
  topics: Record<string, LibraryTopic>;
}
