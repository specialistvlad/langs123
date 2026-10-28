// Generated from library/schema/library.schema.json by npm run types. Edit the schema, then regenerate.

/**
 * A course's index: its name, source language, varieties, sources and sections, each with its topics in order.
 */
export type CourseIndex = Index;
export type Text = string;
/**
 * A variety of a course, such as en-GB or es-419.
 */
export type Variety = string;
/**
 * Where an index, an index entry or a topic stands in its review.
 */
export type Status = "draft" | "in-review" | "approved";
/**
 * A section, topic or subtopic id: lowercase letters, digits and hyphens.
 */
export type Slug = string;
/**
 * A practical cluster (IX-13).
 */
export type Cluster =
  | "question-words"
  | "words-of-place"
  | "words-of-movement"
  | "words-of-time"
  | "how-often"
  | "how-much"
  | "linking-words"
  | "comparing"
  | "numbers-in-daily-life"
  | "polite-words"
  | "asking-the-way"
  | "small-talk"
  | "reference-tables";
/**
 * The id of a block, sentence, item, example or reason: slugs joined by dots, unique in its topic and kept when its text changes.
 */
export type Id = string;
/**
 * An explanation language, from site.yaml.
 */
export type Explain = "en" | "uk" | "es" | "pt" | "fr" | "de" | "it" | "pl" | "tr" | "id" | "vi" | "ja";
/**
 * A topic's address, <course>.<slug>.
 */
export type TopicId = string;
/**
 * A line of the essence, part 00: a form, its transcription, a gloss or an example, and the subtopic it opens.
 */
export type EssenceLine = EssenceLine1 & {
  id: Id;
  form?: Form | Form[];
  ipa?: Form;
  text?: Text;
  ex?: Example;
  variety?: Variety;
  to: Slug;
};
export type EssenceLine1 = {};
/**
 * A form in the course language, left untranslated.
 */
export type Form = string;
/**
 * A block of a subtopic: a fact, a why, an example, a list or a table.
 */
export type Block = Fact | Why | ExampleBlock | List | Table;
/**
 * One line of a list: a form, its transcription, a sentence and its example.
 */
export type ListItem = ListItem1 & {
  id: Id;
  form?: Form | Form[];
  ipa?: Form;
  text?: Text;
  ex?: Example2;
  variety?: Variety;
};
export type ListItem1 = {};
/**
 * A grammatical feature a table crosses, after UniMorph.
 */
export type Feature = "person" | "number" | "gender" | "politeness" | "sentence";
export type Key = string;
/**
 * A form, a list of forms (each of one variety where it carries one), or a sentence naming its row.
 */
export type Cell =
  | Form
  | Sentence
  | (
      | Form
      | {
          form: Form;
          variety: Variety;
        }
    )[];
/**
 * An object the picture library draws.
 */
export type DrawnObject = "ball" | "box" | "house" | "cover" | "table" | "shelf" | "road";
export type Place =
  | "contained"
  | "on-surface"
  | "under"
  | "under-covered"
  | "front"
  | "back"
  | "beside"
  | "near"
  | "between"
  | "above"
  | "below"
  | "across"
  | "outside";
/**
 * A source sentence's translation: one string, or a list where it splits the sentence.
 */
export type Translation = Text | Text[];
export type ISODate = string;
/**
 * The owner's approvals of the work's gates, each with its date; a wave carries the seed of its one-in-ten draw.
 */
export type Approvals = {
  what: string;
  by: "owner";
  date: ISODate;
  seed?: number;
}[];
/**
 * The search needs of one explanation language's readers, each with the queries behind it, where it was found, and the topic that answers it or the reason none does (IX-16).
 */
export type SearchNeeds = ({} & {
  id: Slug;
  /**
   * @minItems 1
   */
  queries: Text[];
  from: "search-console" | "keyword-research";
  topic?: TopicId;
  declined?: Text;
})[];

/**
 * Every data file of the new library (library/): a course's index, a topic's source file, its language files and its review record, the approvals and the concept registry. Each file is checked against its definition; x-rule names the rule of library/RULES.md a definition holds, and x-extra the rule each property it lacks breaks.
 */
export interface Langs123LibraryV1 {
  index?: CourseIndex;
  source?: TopicSource;
  language?: TopicLanguageFile;
  review?: TopicReviewRecord;
  approvals?: Approvals;
  concepts?: ConceptRegistry;
  words?: WordLists;
  kanji?: KanjiByLevel;
  needs?: SearchNeeds;
}
export interface Index {
  course: string;
  name: Localized;
  /**
   * An explanation language, from site.yaml.
   */
  source: "en" | "uk" | "es" | "pt" | "fr" | "de" | "it" | "pl" | "tr" | "id" | "vi" | "ja";
  /**
   * @minItems 2
   */
  varieties?: Variety[];
  status: Status;
  sources: {
    id: Slug;
    name: Text;
    licence: Text;
    url: string;
    /**
     * @minItems 1
     */
    took: ("topics" | "levels")[];
  }[];
  /**
   * @minItems 1
   */
  sections: {
    id: Slug;
    name: Localized;
    /**
     * @minItems 1
     */
    topics: Entry[];
  }[];
}
/**
 * A name in every explanation language.
 */
export interface Localized {
  en: Text;
  uk: Text;
  es: Text;
  pt: Text;
  fr: Text;
  de: Text;
  it: Text;
  pl: Text;
  tr: Text;
  id: Text;
  vi: Text;
  ja: Text;
}
/**
 * A topic in its section of the index, defined before its text is written.
 */
export interface Entry {
  id: Slug;
  subject: Text;
  /**
   * @minItems 1
   */
  covers: Text[];
  /**
   * The topic's place in the study path at each level it is planned at.
   */
  path: {
    [k: string]: number;
  };
  /**
   * Where an index, an index entry or a topic stands in its review.
   */
  status: "draft" | "in-review" | "approved";
  concepts?: Slug[];
  replaces?: string;
  practical?: Cluster;
  size?: number;
  script?: "alphabet" | "sounds" | "soft-sign" | "kana";
  needs?: Id[];
  misleads?: {
    lang: Explain;
    form: Text;
    counterpart: Text;
  }[];
}
/**
 * A topic's source file: its structure, its text in the course language, its explanations in the source language, its errors and its status.
 */
export interface TopicSource {
  id: TopicId;
  status: Status;
  nativeReview: boolean;
  title: Sentence;
  definition: Sentence;
  /**
   * @minItems 1
   */
  essence: EssenceLine[];
  /**
   * @minItems 1
   */
  subtopics: Subtopic[];
  errors: CommonError[];
  picture?: Picture;
}
/**
 * A sentence of explanation in the source language, translated in each language file under its id.
 */
export interface Sentence {
  id: Id;
  text: Text;
}
/**
 * A sentence in the course language, translated as a whole under its id.
 */
export interface Example {
  id: Id;
  text: Text;
  variety?: Variety;
}
/**
 * A numbered part of a topic: its level, its title and its blocks.
 */
export interface Subtopic {
  id: Slug;
  /**
   * A level of the CEFR scale, from levels.yaml.
   */
  level: "A0" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  title: Sentence;
  /**
   * @minItems 1
   */
  blocks: Block[];
}
/**
 * The rule: its sentences.
 */
export interface Fact {
  id: Id;
  type: "fact";
  variety?: Variety;
  /**
   * @minItems 1
   */
  text: Sentence[];
}
/**
 * The one reason that helps a learner remember the rule: its sentences.
 */
export interface Why {
  id: Id;
  type: "why";
  variety?: Variety;
  /**
   * @minItems 1
   */
  text: Sentence[];
}
export interface ExampleBlock {
  id: Id;
  type: "example";
  variety?: Variety;
  /**
   * @minItems 1
   */
  items: Example1[];
}
/**
 * A sentence in the course language, translated as a whole under its id.
 */
export interface Example1 {
  id: Id;
  text: Text;
  variety?: Variety;
}
export interface List {
  id: Id;
  type: "list";
  variety?: Variety;
  /**
   * @minItems 1
   */
  items: ListItem[];
}
/**
 * A sentence in the course language, translated as a whole under its id.
 */
export interface Example2 {
  id: Id;
  text: Text;
  variety?: Variety;
}
/**
 * A true grid: the two features it crosses, its columns and its rows.
 */
export interface Table {
  id: Id;
  type: "table";
  variety?: Variety;
  axes: {
    rows: Feature;
    columns: Feature;
  };
  /**
   * @minItems 2
   */
  columns: {
    id: Id;
    key: Key;
    text: Text;
  }[];
  /**
   * @minItems 1
   */
  rows: {
    id: Id;
    features: Features;
    cells: {
      [k: string]: Cell;
    };
  }[];
}
/**
 * The values a table row carries; a feature it omits covers every value.
 */
export interface Features {
  person?: 1 | 2 | 3;
  number?: "sg" | "pl";
  gender?: "masc" | "fem" | "neut";
  politeness?: "infm" | "form";
  sentence?: "statement" | "negative" | "question" | "yes" | "no";
}
/**
 * A common error: the wrong form, its correction and its rule, in its subtopic, with its speakers.
 */
export interface CommonError {
  id: Id;
  /**
   * A section, topic or subtopic id: lowercase letters, digits and hyphens.
   */
  in: string;
  wrong: Form;
  right: Form | Example1;
  rule: Sentence;
  speakers: Speakers;
}
/**
 * Each language whose speakers make an error, with its reason.
 */
export interface Speakers {
  [k: string]: Sentence;
}
/**
 * A scene grid: one cell per essence line, placing the figure against the ground.
 */
export interface Picture {
  id: Id;
  kind: "scene-grid";
  figure: DrawnObject;
  ground: DrawnObject;
  /**
   * @minItems 1
   */
  cells: {
    line: Id;
    place: Place;
    ground?: DrawnObject | DrawnObject[];
  }[];
}
/**
 * One explanation language of a topic: its translations keyed by the source's ids, the fingerprints they were written from, and its own blocks, errors and speakers.
 */
export interface TopicLanguageFile {
  language: Explain;
  nativeReview: boolean;
  text: {
    [k: string]: Translation;
  };
  fingerprints?: {
    [k: string]: string;
  };
  blocks?: OwnBlock[];
  errors?: OwnError[];
  speakers?: {
    [k: string]: Sentence;
  };
}
/**
 * A block of a language's own, for its readers alone: placed in a subtopic after a source block.
 */
export interface OwnBlock {
  id: Id;
  type: "fact" | "why" | "example";
  in: Slug;
  after: Id;
  variety?: Variety;
  /**
   * @minItems 1
   */
  text?: Sentence[];
  /**
   * @minItems 1
   */
  items?: OwnExample[];
}
export interface OwnExample {
  id: Id;
  text: Text;
  tr: Text;
}
/**
 * An error of a language's own speakers, in its errors part.
 */
export interface OwnError {
  id: Id;
  in: Slug;
  after?: Id;
  wrong: Form;
  right: Form | OwnExample;
  rule: Sentence;
  speakers: Speakers;
}
/**
 * A topic's review record: its writer, its statuses, each review run with its findings and the writer's answers, and the owner's readings.
 */
export interface TopicReviewRecord {
  writer: Session;
  /**
   * @minItems 1
   */
  statuses: {
    status: Status;
    date: ISODate;
    by: Text;
  }[];
  reviews?: {
    session: Text;
    model: Text;
    date: ISODate;
    run: 1 | 2;
    findings: Finding[];
  }[];
  flagged?: string[];
  owner?: {
    language: string;
    date: ISODate;
    why: "flagged" | "sampled";
  }[];
}
export interface Session {
  session: Text;
  model: Text;
}
export interface Finding {
  id: Id;
  at: Id;
  language?: Explain;
  rule?: string;
  source?: Slug;
  text: Text;
  fix?: Text;
  answer?: "fixed" | "declined";
  reason?: Text;
  /**
   * A finding raised again on an element and rule the writer answered before: the earlier answer, fixed or declined. It goes to the owner's reading.
   */
  again?: "fixed" | "declined";
}
/**
 * The concept keys every course's index names its topics' concepts from.
 */
export interface ConceptRegistry {
  [k: string]: {
    description: Text;
  };
}
/**
 * The words the linter reads for one explanation language: the words that turn a sentence away from the subject (SH-08, VO-04), the word for a topic (NO-45), the forms of address an explanation leaves out (NO-35 to NO-44, NO-58), spellings (NO-01, NO-52, NO-53, NO-56), the Spanish vosotros and voseo forms (NO-29, NO-31) and the Turkish proper names (NO-55). An entry all in lowercase matches in any case; one with a capital matches as written.
 */
export interface WordLists {
  language: Explain;
  tour?: {
    page?: string[];
    topic?: string[];
    guide?: string[];
    course?: string[];
  };
  topic?: {
    word: Text;
    synonyms: string[];
  };
  address?: string[];
  spellings?: {
    wrong: Text;
    right: Text;
  }[];
  vosotros?: string[];
  voseo?: string[];
  names?: string[];
}
/**
 * The words Japanese examples write in kanji at A1 and at A2, with the source of the list and its licence (NO-26).
 */
export interface KanjiByLevel {
  source: {
    name: Text;
    licence: Text;
    url: string;
  };
  A1?: {
    word: Text;
    reading: string;
  }[];
  A2?: {
    word: Text;
    reading: string;
  }[];
}
