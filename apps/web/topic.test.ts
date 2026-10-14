// Every topic page ends with a link to its file in GitHub's editor, its text Edit this page on GitHub
// beside the GitHub mark, and a Print button.
import { expect, test } from "bun:test";
import { SITE } from "../../scripts/lib.ts";
import { readPage, testSite } from "./test-site.ts";

const pages = await testSite();
const topicPages = pages.filter((p) => /^en\/\w+\/[\w-]+\/[\w-]+\/index\.html$/.test(p) && !p.includes("/cheatsheets/"));

test.each(topicPages)("%s links to its file in GitHub's editor, named Edit on GitHub", async (path) => {
  const doc = await readPage(path);
  const edit = doc.querySelector(".doc > .page-tools a.page-tool.edit");
  expect(edit?.getAttribute("href")).toStartWith(`${SITE.repository}/edit/main/languages/`);
  expect(edit?.textContent).toBe("Edit this page on GitHub");
  expect(doc.querySelector(".doc > .page-tools [data-print]")?.textContent).toBe("Print");
  expect(doc.querySelector(".doc-head .page-tool, .doc-head [data-print]")).toBeNull();
});
