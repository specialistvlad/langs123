// The split view (board v212): on a tablet or desktop (860px and up) the page sits in the left pane and what it opens
// fills the right pane; a phone shows one screen at a time. The Home, a course index and the credits are built on it
// (client-split.ts keeps the states and opens the items).
//
// MARKUP (split() below builds it; a page puts its own content in the three slots)
//   <div class="sp [sp-home]" data-split="equal|slim|hidden" data-sp-open="/path/">
//     <section class="sp-left">   the page: its title row (with listButton()), its search, its list
//     <div class="sp-div" data-sp-div role="separator">   the divider, dragged on a wide screen
//     <section class="sp-right">
//       <div class="sp-tools">    the pane's glass groups at its top right (Read in, Level, Close ...)
//       <div class="sp-body">     the pane's content: a choose() placeholder, or what an item opened
//   data-split is the reader's state, set before first paint (the boot script) and kept in the site's store
//   (ln-split: equal 50%, slim 320px, hidden; ln-split-w: the width a drag chose). Where script is off, a page with
//   nothing open shows the left pane alone, full width. data-sp-open names the path of the item the right pane
//   shows and is absent while it shows its placeholder; a page that opens with an item shown (credits) renders it.
//   The list button (listButton()) steps equal -> slim -> hidden -> equal and its label names the next step
//   (narrowList, hideList, showList). The left pane's first child is its .sp-title row (44px: the Home or Back
//   button or the brand first, the glass buttons after, the list button last); hidden shows that row alone, at the
//   top left of the content. Modifier classes: sp-home (the Home's left pane: its search, its toolbar), sp-item (on a
//   phone the right pane is the page and the left pane is out: the credits).
//
// ITEMS (opening what a link leads to in the right pane)
//   <a href="/en/english/" data-sp-item>   in the left pane or the tools. On a wide screen a plain click fetches the target page,
//     takes its right-pane fragment into the right pane and pushes the address; on a phone, with a modifier key, or
//     when the target has no fragment the link navigates as any link does. The same markup works without script.
//   data-sp-unit   on the card or row holding the link: the open item's unit (else the link) gets data-sp-chosen and
//     its link aria-current="true"; a page styles [data-sp-chosen] (the Home outlines the card in the accent).
//   data-sp-from='{"body":".css","tools":".css","extras":".css"}'   optional, on the link: where the target keeps its
//     fragment when it does not declare it with the three attributes below.
//
// THE TARGET PAGE declares its fragment (its own markup stays complete, so the page works on its own):
//   data-sp-fragment   the element whose copy becomes the right pane's body (its id, if any, is dropped)
//   data-sp-tools      the elements (any number) that become the pane's tools: the glass groups, a Close link
//   data-sp-extras     the menus and popovers the tools open (copied beside the tools)
//   data-sp-close      on a link in the fragment or the tools: closes the pane to its placeholder where the pane
//     was opened by an item, and navigates (its href) where the page itself shows the item
//   A link inside the fragment whose path lies below the item's moves the item into the left pane: it goes to
//   "<item path>?open=<its path>" (the course index with the topic chosen); one to the item's own path (a part
//   of the topic, #section) and any other link keep their address.
//   The page's #lv-data entries are added to the level popover; its <html data-varieties data-variety> set the
//   varieties of the course (the reader's choice, else the default); document event "sp:shown" follows each change.
//
// ADDRESS: a shown item is "<page>?open=<item path>" ("/?open=/en/english/", "/en/english/?open=/en/english/05-tenses/
// simple-tenses/"): the page's own file is served and the script opens the item, so Back and reload show it chosen;
// the value is honoured only when a [data-sp-item] link of the page leads to it. The item's own path is the item's
// page; the address keeps the page that holds the list and names the item chosen.
//
// PLACEHOLDER: choose({ title, hint, icon }) is the right pane's body while nothing is open ("Choose a course",
// "Its topics open here."); CHOOSE_COURSE is the Home's icon.
import { glyph } from "./glyphs.ts";
import { escapeHtml } from "./html.ts";
import type { Ui } from "./ui.ts";

const LIST = glyph('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M9.5 5v14"/>', 22, 1.9);
export const CHOOSE_COURSE = glyph(
  '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5c3 3 3 16.5 0 19M12 2.5c-3 3-3 16.5 0 19"/>',
  44,
  1.6,
);

// The list button: its label names the step it takes (client-split.ts follows the state).
export function listButton(t: Ui): string {
  const labels = escapeHtml(JSON.stringify({ equal: t.narrowList, slim: t.hideList, hidden: t.showList }));
  const label = escapeHtml(t.narrowList);
  return `<button type="button" class="sp-list glass" data-sp-list data-sp-labels="${labels}" aria-label="${label}" title="${label}">${LIST}</button>`;
}

export interface Placeholder {
  title: string;
  hint: string;
  icon: string;
}
export const choose = (p: Placeholder): string =>
  `<div class="sp-choose" data-sp-choose>${p.icon}<p class="sp-choose-t">${escapeHtml(p.title)}</p><p class="sp-choose-s">${escapeHtml(p.hint)}</p></div>`;

// Runs as the root's first child, before the panes paint: the reader's state and width, and the mark for an address
// that names an item (the placeholder waits for it).
const BOOT = `<script>(function(){var e=document.currentScript.parentElement,s="",w="";try{s=localStorage.getItem("ln-split")||"";w=localStorage.getItem("ln-split-w")||""}catch(x){}e.dataset.split=s==="slim"||s==="hidden"?s:"equal";if(+w>.2&&+w<.8)e.style.setProperty("--sp-w",+w*100+"%");if(/[?&]open=/.test(location.search))e.dataset.spPending=""})()</script>`;

export interface Split {
  // The page's wording: the divider is named resizeList.
  t: Ui;
  // Modifier classes of the root (sp-home: the Home's left pane).
  cls?: string;
  left: string;
  tools: string;
  body: string;
  // The path of the item the page itself shows in the right pane.
  open?: string;
}

export function split(s: Split): string {
  const open = s.open === undefined ? "" : ` data-sp-open="${escapeHtml(s.open)}"`;
  return `<div class="sp${s.cls === undefined ? "" : ` ${s.cls}`}"${open}>${BOOT}
<section class="sp-left">
${s.left}
</section>
<div class="sp-div" data-sp-div role="separator" aria-orientation="vertical" aria-label="${escapeHtml(s.t.resizeList)}" title="${escapeHtml(s.t.resizeList)}" tabindex="0"></div>
<section class="sp-right">
<div class="sp-tools">${s.tools}</div>
<div class="sp-body">${s.body}</div>
</section>
</div>`;
}
