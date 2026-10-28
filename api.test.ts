// The library's interface holds what programs built on it read: the build, the export, the search, the readers
// and the rule catalog.
import { expect, test } from "bun:test";
import * as api from "./api.ts";

test("api.ts exports the build, the export, the search, the library's readers and the rule catalog", () => {
  expect(Object.keys(api).sort()).toEqual(
    [
      "LEVELS",
      "LIBRARY_FILE",
      "LIBRARY_V1_DIR",
      "RULES_FILE",
      "ROOT",
      "SAMPLE",
      "SEARCH_CASES",
      "SITE",
      "V1_SAMPLES",
      "VERSION",
      "build",
      "designArg",
      "figures",
      "grounds",
      "GROUNDS",
      "places",
      "primitive",
      "primitives",
      "scene",
      "sceneGrid",
      "exportLibrary",
      "loadCurriculum",
      "loadTopics",
      "localize",
      "plainText",
      "readRules",
      "reading",
      "refRange",
      "ruleProblems",
      "searchData",
      "served",
      "say",
      "textIn",
      "topicTitle",
      "topicUrl",
      "trackUrl",
    ].sort(),
  );
});
