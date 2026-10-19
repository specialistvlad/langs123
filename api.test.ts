// The library's interface holds what programs built on it read: the build, the export and the readers.
import { expect, test } from "bun:test";
import * as api from "./api.ts";

test("api.ts exports the build, the export and the library's readers", () => {
  expect(Object.keys(api).sort()).toEqual(
    [
      "LEVELS",
      "LIBRARY_FILE",
      "ROOT",
      "SAMPLE",
      "SITE",
      "build",
      "exportLibrary",
      "loadCurriculum",
      "loadTopics",
      "localize",
      "plainText",
      "reading",
      "refRange",
      "say",
      "textIn",
      "topicTitle",
      "topicUrl",
      "trackUrl",
    ].sort(),
  );
});
