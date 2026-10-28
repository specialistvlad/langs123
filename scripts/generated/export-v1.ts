// Generated from library/schema/export.schema.json by npm run types. Edit the schema, then regenerate.

export type Explain = "en" | "uk" | "es" | "pt" | "fr" | "de" | "it" | "pl" | "tr" | "id" | "vi" | "ja";
export type Variety = string;
export type Level = "A0" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Id = string;
export type Form = string | string[];
export type Block = Fact | Why | ExampleBlock | List | Table;

/**
 * The new library's export, version 0.1.0 (requirements 9.2, 9.8, 9.10): library.json for the index screens and one file per course for its topics. Text keeps the inline marks of library/schema/library.schema.json; x-component names the component of the presentation map that shows each part.
 */
export interface Langs123LibraryV1Export {
  library?: LibraryFile;
  course?: CourseFile;
}
/**
 * What the index screens read: every course with its sections, its topics' titles, definitions, levels and reading minutes, and its study path.
 */
export interface LibraryFile {
  version: "0.1.0";
  source: {
    commit: string;
  };
  /**
   * languages/site.yaml: the name, the URL, the credit and the licences, and the explanation languages.
   */
  site: {};
  levels: {}[];
  /**
   * languages/interface.yaml: the wording every app shares.
   */
  interface: {};
  courses: Course[];
}
export interface Course {
  code: string;
  name: {
    [k: string]: string;
  };
  source: Explain;
  varieties: {
    code: Variety;
    name: {
      [k: string]: string;
    };
  }[];
  levels: Level[];
  sections: {
    id: Id;
    name: {
      [k: string]: string;
    };
    topics: {
      id: Id;
      title: Translated;
      definition: Translated;
      levels: Level[];
      minutes: {
        [k: string]: number;
      };
    }[];
  }[];
  path: {
    level: Level;
    topics: Id[];
  }[];
}
/**
 * A text in each explanation language that has it: one string, or a list where a translation splits a sentence. Text keeps the library's inline marks.
 */
export interface Translated {
  [k: string]: string | string[];
}
/**
 * One course's topics, loaded when a reader opens the course (9.10).
 */
export interface CourseFile {
  version: "0.1.0";
  course: string;
  topics: Topic[];
}
export interface Topic {
  id: Id;
  slug: Id;
  status: "draft" | "in-review" | "approved";
  title: Sentence;
  definition: Sentence;
  levels: Level[];
  minutes: {
    [k: string]: number;
  };
  essence: Item[];
  picture?: Picture;
  subtopics: Subtopic[];
  errors: CommonError[];
  own: {
    [k: string]: Own;
  };
}
export interface Sentence {
  id: Id;
  text: Translated;
  /**
   * Where a translation joins this sentence with the ones after it: how many it spans, by language; those sentences lack that language.
   */
  span?: {
    [k: string]: number;
  };
}
export interface Item {
  id: Id;
  form?: Form;
  ipa?: string;
  text?: Translated;
  ex?: Example;
  variety?: Variety;
  to?: Id;
  level?: Level;
}
export interface Example {
  id: Id;
  text: string;
  /**
   * The example's translation into each explanation language but the course's own.
   */
  tr: {
    [k: string]: string | string[];
  };
  variety?: Variety;
}
export interface Picture {}
export interface Subtopic {
  id: Id;
  number: number;
  level: Level;
  title: Sentence;
  blocks: Block[];
}
export interface Fact {
  id: Id;
  type: "fact";
  variety?: Variety;
  text: Sentence[];
}
export interface Why {
  id: Id;
  type: "why";
  variety?: Variety;
  text: Sentence[];
}
export interface ExampleBlock {
  id: Id;
  type: "example";
  variety?: Variety;
  items: Example[];
}
export interface List {
  id: Id;
  type: "list";
  variety?: Variety;
  items: Item[];
}
export interface Table {
  id: Id;
  type: "table";
  variety?: Variety;
  axes: {
    rows: string;
    columns: string;
  };
  columns: {
    id: Id;
    key: string;
    text: Translated;
  }[];
  rows: {
    id: Id;
    features: {
      [k: string]: string | number;
    };
    cells: {
      [k: string]:
        | string
        | Sentence
        | (
            | string
            | {
                form: string;
                variety: Variety;
              }
          )[];
    };
  }[];
}
export interface CommonError {
  id: Id;
  in: Id;
  level: Level;
  wrong: string;
  right: string | Example;
  rule: Sentence;
  speakers: {
    [k: string]: Sentence;
  };
}
/**
 * A language's own text, shown in its layer alone: its blocks after the block each follows, its speakers' errors and reasons.
 */
export interface Own {
  blocks: {
    id: Id;
    type: "fact" | "why" | "example";
    in: Id;
    after: Id;
    variety?: Variety;
    text?: {
      id: Id;
      text: string;
    }[];
    items?: {
      id: Id;
      text: string;
      tr: string;
    }[];
  }[];
  errors: {
    id: Id;
    in: Id;
    level: Level;
    after?: Id;
    wrong: string;
    right:
      | string
      | {
          id: Id;
          text: string;
          tr: string;
        };
    rule: {
      id: Id;
      text: string;
    };
    speakers: {
      [k: string]: {
        id: Id;
        text: string;
      };
    };
  }[];
  speakers: {
    [k: string]: {
      id: Id;
      text: string;
    };
  };
}
