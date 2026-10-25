// The pages in the frame: the Home's search and More, the menus, the Read in choice, the credits' copy button and a topic page.
import { creditsCopy } from "./client-credits.ts";
import { homeSearch } from "./client-home.ts";
import { moreMenu } from "./client-more.ts";
import { topicPage } from "./client-topic.ts";
import { readChoice } from "./client-read.ts";
import { trackMenus } from "./client-track.ts";

export function framePages(): void {
  homeSearch();
  moreMenu();
  trackMenus();
  readChoice();
  creditsCopy();
  topicPage();
}
