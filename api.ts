// The library's interface for programs built on it: the site build with its page facts, head option and sample, the
// data export, and the readers of the curriculum, its topics, their levels, titles and addresses. A program
// that imports only this module keeps working as the modules behind it change.
export { build, type BuildOptions, type HeadChange, type PageFacts } from "./apps/web/build.ts";
export { SAMPLE, type Sample } from "./apps/web/sample.ts";
export { SEARCH_CASES, searchData, type SearchFile as SearchData } from "./apps/web/pages/home-search.ts";
export { topicUrl, trackUrl } from "./apps/web/urls.ts";
export {
  exportLibrary,
  type Keyed,
  type LevelTones,
  type Library,
  LIBRARY_FILE,
  type LibraryBlock,
  type LibraryCell,
  type LibraryColumn,
  type LibraryErrorRow,
  type LibraryItem,
  type LibraryRow,
  type LibraryTopic,
  type TableType,
} from "./scripts/export.ts";
export { topicTitle } from "./scripts/content.ts";
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
