// Generated from languages/schema/curriculum.schema.json by npm run types. Edit the schema, then regenerate.

export type Explain = "en" | "uk" | "es" | "pt" | "fr" | "de" | "it" | "pl" | "tr" | "id" | "vi";
/**
 * A variety of a language being learned, as a BCP 47 tag.
 */
export type Variety = "en-GB" | "en-US" | "es-419" | "es-ES";

/**
 * Every planned topic of every language being learned: sections by category, and the study path by level.
 */
export interface Langs123Curriculum {
  /**
   * @minItems 1
   */
  languages: {
    /**
     * ISO 639-1 code of the language being learned; its topics live in languages/{code}/
     */
    code: string;
    /**
     * false keeps the language from readers; its data stays and is still checked
     */
    enabled: boolean;
    /**
     * URL segment of the language being learned
     */
    slug: string;
    /**
     * The page icon of the language being learned: a flag emoji that marks its pages and links
     */
    flag: string;
    name: Localized;
    /**
     * The explanation languages the language is written for, the source language of site.yaml first; every explanation language when absent.
     *
     * @minItems 1
     */
    explain?: Explain[];
    /**
     * The varieties a reader chooses between, the default first. An element tagged with a variety shows only while that variety is chosen.
     *
     * @minItems 2
     */
    varieties?: Variety[];
    /**
     * Topics by category; the menu's Categories order.
     *
     * @minItems 1
     */
    sections: {
      dir: string;
      title: TrackLocalized;
      /**
       * @minItems 1
       */
      topics: {
        slug: string;
        /**
         * Planned range of a topic without a topic file; a written topic takes its range from its data.
         */
        levels?: string;
        title?: TrackLocalized;
      }[];
    }[];
    /**
     * The study path: per level, lowest first, the topics to study at that level, in order. A topic comes back at each level where it grows.
     */
    path: {
      /**
       * @minItems 1
       *
       * Items: Topic ID: {lang}.{section}.{topic}
       */
      [k: string]: string[];
    };
  }[];
}
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
 * Text in each explanation language of the language being learned; npm run check requires exactly those.
 */
export interface TrackLocalized {
  en?: string;
  uk?: string;
  es?: string;
  pt?: string;
  fr?: string;
  de?: string;
  it?: string;
  pl?: string;
  tr?: string;
  id?: string;
  vi?: string;
}
