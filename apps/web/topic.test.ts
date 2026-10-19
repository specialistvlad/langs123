// A topic page's Edit link opens the topic's file in GitHub's editor.
import { expect, test } from "bun:test";
import { SITE } from "../../scripts/lib.ts";
import { editUrl } from "./parts.ts";

test("the Edit link opens the topic's file on main in GitHub's editor", () => {
  expect(editUrl("languages/en/02-tenses/simple-tenses/topic.yaml")).toBe(
    `${SITE.repository}/edit/main/languages/en/02-tenses/simple-tenses/topic.yaml`,
  );
});
