// A course's index in the frame (frame.css, track*.css): a phone shows the course alone (the title row with the Home
// button and the topic count, the Explained in line, the topics), a page of one column with the bottom bar; from 1024px
// the page is two columns (course-column.ts): the course's topics on the left, and on the right "Choose a topic" until a
// topic is chosen (a topic's page holds the same column with the topic read at its right). The topics follow the Group
// button's choice, Categories or By level (data-set-order), each section's heading ending with its topic count at the
// chosen level. The Level button opens the level popover headed by the course; the level filter, the variety switch
// and the grouping are the client's own (data-set-level, data-set-variety, data-set-order): client-track.ts follows their
// state in the menus, client-chips.ts the counts.
import { SITE } from "../../../scripts/lib.ts";
import { alternates, type Track } from "../context.ts";
import { courseLevel, courseSide, menus } from "../course-column.ts";
import { escapeHtml } from "../html.ts";
import { type LevelEntry, levelData, levelPopover } from "../level-popover.ts";
import { ranged, refsRange } from "../parts.ts";
import { CHOOSE_TOPIC } from "../track-parts.ts";
import { trackUrl } from "../urls.ts";

export function trackIndex(track: Track): void {
  const { ctx, lang, explain, t, title, langRefs, written } = track;
  const entries: Record<string, LevelEntry> = { [lang.code]: courseLevel(track).entry };
  const choose = `<div class="cl-choose">${CHOOSE_TOPIC}<p class="cl-choose-t">${escapeHtml(t.chooseTopic)}</p><p class="cl-choose-s">${escapeHtml(t.chooseTopicHint)}</p></div>`;
  const body = `<div class="cl" data-cl="track">
${courseSide(track)}
<div class="cl-main">${choose}</div>
</div>
${menus(track)}
${levelPopover(explain)}
${levelData(entries)}`;
  ctx.add({
    kind: "track",
    lang: explain,
    title: `${title} — ${SITE.name}`,
    description: `${title}, ${t.explained}: ${t.written(written.length, langRefs.length)}.`,
    path: trackUrl(explain, lang),
    alternates: alternates((e) => trackUrl(e, lang), track.explains),
    level: true,
    varieties: lang.varieties,
    body,
    about: { name: title, lang: lang.code, ...ranged(refsRange(langRefs, explain)) },
  });
}
