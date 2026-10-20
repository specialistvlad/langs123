// The pages in the frame: the Home's search, the menus, the Read in choice, the credits' copy button and a topic page.
import { creditsCopy } from "./client-credits.ts";
import { homeSearch } from "./client-home.ts";
import { topicPage } from "./client-topic.ts";
import { readChoice } from "./client-read.ts";
import { trackMenus } from "./client-track.ts";

export function framePages(): void {
  homeSearch();
  trackMenus();
  readChoice();
  creditsCopy();
  topicPage();
}
