// On phones the top bar holds one up link to the parent page in place of the breadcrumb: a page inside a track
// leads to the track's index, named by its language; the track's index, the credits and the missing page lead
// to the home page; the home page has none. phone.css shows it on small screens.
import { SITE } from "../../scripts/lib.ts";
import type { Crumb } from "./chrome.ts";
import { escapeHtml } from "./html.ts";
import type { PageKind } from "./layout.ts";

const CHEVRON =
  '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';

export function upLink(kind: PageKind, crumbs: Crumb[], home: string): string {
  if (kind === "home") return "";
  const track = kind === "track" ? undefined : crumbs.flatMap((c) => c.menu ?? []).find((c) => c.on);
  const [href, label] = track === undefined ? [home, SITE.name] : [track.href, track.label];
  return `<a class="up-link" href="${href}">${CHEVRON}<span>${escapeHtml(label)}</span></a>`;
}
