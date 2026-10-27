// Interface wording per explanation language, from languages/interface.yaml.
import { EXPLAIN_CODES, type Explain, explainName, say } from "../../scripts/lib.ts";

// Interface wording keys this app shows, all from languages/interface.yaml.
const TEXT_KEYS = [
  // Wording only the iOS app's split view asks for (Sources/SplitView.swift); the web app shows none of it.
  "chooseCourse",
  "chooseCourseHint",
  "narrowList",
  "hideList",
  "showList",
  "languagesIKnow",
  "languagesIntro",
  "languagesNote",
  "languagesLimit",
  "addLanguage",
  "add",
  "reorder",
  "remove",
  "courseLabel",
  "nowLanguageMissing",
  "continue",
  "courseExplainedIn",
  "fallbackLanguage",
  "otherExplanationLanguages",
  "otherExplanationNote",
  "noneOfYourLanguages",
  "explanationLanguage",
  "followMyLanguages",
  "nowLanguage",
  "notInCourse",
  "courseOtherLanguages",
  "topicFallback",
  "changeLanguage",
  "groupBy",
  "level",
  "variety",
  "upTo",
  "index",
  "chooseTopic",
  "chooseTopicHint",
  "byLevel",
  "categories",
  "upNext",
  "studyPath",
  "pathStep",
  "previous",
  "next",
  "startOver",
  "levels",
  "sections",
  "topics",
  "notFound",
  "backHome",
  "search",
  "searchTopicsCount",
  "searchExplainedIn",
  "searchNoResults",
  "searchNoResultsHint",
  "searchTryThese",
  "clear",
  "close",
  "website",
  "copy",
  "copied",
  "contents",
  "wrong",
  "right",
  "allLevels",
  "levelAllLevels",
  "levelHidden",
  "varietyHidden",
  "readingTime",
  "theme",
  "more",
  "themeAuto",
  "themeSystem",
  "themeLight",
  "themeDark",
  "summary",
] as const;

export type Ui = Record<(typeof TEXT_KEYS)[number], string> & {
  explained: string;
  track: (name: string) => string;
  written: (n: number, total: number) => string;
  minutes: (n: number) => string;
};

function makeUi(e: Explain): Ui {
  const text = Object.fromEntries(TEXT_KEYS.map((key) => [key, say(key, e)])) as Record<(typeof TEXT_KEYS)[number], string>;
  return {
    ...text,
    explained: say("explained", e, { name: explainName(e) }),
    track: (name: string) => say("track", e, { name }),
    written: (n: number, total: number) => say("written", e, { n, total }),
    minutes: (n: number) => say("minutes", e, { n }),
  };
}

const UI = new Map(EXPLAIN_CODES.map((e) => [e, makeUi(e)]));
export function ui(explain: Explain): Ui {
  const t = UI.get(explain);
  if (t === undefined) throw new Error(`No interface wording for "${explain}"`);
  return t;
}
