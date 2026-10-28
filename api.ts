// The library's interface for programs built on it: the site build with its page facts, head option, sample and
// design, the pictures, the data export (today's library.json, or the new library's files with { library: "v1" } and
// its version), the readers of the curriculum, its topics, their levels, titles and addresses, and the reader of the
// new library's rule catalog (library/RULES.md) with its check. A program that imports only this module keeps working
// as the modules behind it change.
export { build, type BuildOptions, type HeadChange, type PageFacts } from "./apps/web/build.ts";
export { SAMPLE, type Sample } from "./apps/web/sample.ts";
export { designArg } from "./apps/web/tokens.ts";
// Each block's text as the web's reading shows it, for another reader of the export to hold its own text to.
export { readingTexts } from "./apps/web/reading-texts.ts";
// The quotation marks of a phrase in another language (the l1 mark), by language, as the reading sets them.
export { l1Quotes } from "./apps/web/reading-marks.ts";
// Each id of a topic's text by the element the reading draws it in, where the review preview pins a finding.
export { anchorsOf } from "./apps/web/review.ts";
// The pictures of the library (8.9): a scene per place, a primitive alone, and the grid of a topic's cells.
export {
  type Figure,
  figures,
  type Ground,
  grounds,
  GROUNDS,
  type Place,
  places,
  primitive,
  type Primitive,
  primitives,
  scene,
  type SceneCell,
  sceneGrid,
  type SceneOptions,
} from "./apps/web/pictures.ts";
export { type Served, served } from "./apps/web/serve.ts";
export { SEARCH_CASES, searchData, type SearchFile as SearchData } from "./apps/web/pages/home-search.ts";
export { topicUrl, trackUrl } from "./apps/web/urls.ts";
export {
  exportLibrary,
  type Keyed,
  type LevelTones,
  type Library,
  LIBRARY_FILE,
  LIBRARY_V1_DIR,
  type LibraryBlock,
  type LibraryCell,
  type LibraryColumn,
  type LibraryErrorRow,
  type LibraryItem,
  type LibraryRow,
  type LibraryTopic,
  type LibraryV1,
  type TableType,
  type V1Options,
} from "./scripts/export.ts";
// The version of the new library's export, of its JSON Schema and of this interface (9.8): 0.x until v1.
export { EXPORT_VERSION as VERSION } from "./scripts/v1/export/library.ts";
// The review of the new library's topics in Claude Code sessions, and the flagged queue its records make.
export { review, reviewQueue } from "./scripts/review/index.ts";
export { claudeAttempt, runnerOf } from "./scripts/review/run.ts";
// The new library's samples, a root the export reads with drafts, as SAMPLE serves today's library.
export { SAMPLES_ROOT as V1_SAMPLES } from "./scripts/v1/load.ts";
export { topicTitle } from "./scripts/content.ts";
export { type Catalog, type Covered, readRules, type Rule, RULES_FILE, ruleProblems } from "./scripts/rule-catalog.ts";
export { type Range, refRange } from "./scripts/levels.ts";
export {
  type CurriculumLanguage,
  type Explain,
  LEVELS,
  loadCurriculum,
  loadTopics,
  localize,
  ROOT,
  say,
  SITE,
  type TopicRef,
} from "./scripts/lib.ts";
export { plainText, reading, textIn } from "./scripts/text.ts";
