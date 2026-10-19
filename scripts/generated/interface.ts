// Generated from languages/schema/interface.schema.json by npm run types. Edit the schema, then regenerate.

export interface InterfaceWording {
  /**
   * Wording by key, one string per explanation language.
   */
  text: {
    [k: string]: Localized;
  };
  /**
   * The name of each slot code of CONVENTIONS.md §12 in every explanation language; a code without a name renders as written.
   */
  slots?: {
    [k: string]: Localized;
  };
  /**
   * Counts by key: in every explanation language, one form per plural category its plural rules use (Intl.PluralRules), other always; {n} is the number.
   */
  counts?: {
    [k: string]: Counted;
  };
}
/**
 * Text in every explanation language.
 */
export interface Localized {
  en: string;
  uk: string;
  es: string;
  pt: string;
  fr: string;
  de: string;
  it: string;
  pl: string;
  tr: string;
  id: string;
  vi: string;
}
/**
 * A count's forms in every explanation language.
 */
export interface Counted {
  en: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  uk: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  es: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  pt: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  fr: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  de: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  it: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  pl: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  tr: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  id: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
  vi: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  };
}
