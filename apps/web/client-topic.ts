// A topic page (pages/topic.ts): the phone's contents sheet follows the contents column's current section; a
// sheet closes once a choice or a link is taken; the Read in menu closes on a tap elsewhere or Escape; the
// course's index opens on the current topic; and a table wider than its card scrolls sideways, its cut edge
// faded until the reader reaches it.
export function topicPage(): void {
  if (document.documentElement.dataset["page"] !== "topic") return;
  const rail = document.querySelector(".tp-rail .toc");
  const sheet = document.querySelector("#tp-contents .toc");
  if (rail && sheet) {
    const sync = (): void => {
      const mine = sheet.querySelectorAll("a");
      rail.querySelectorAll("a").forEach((a, i) => mine[i]?.classList.toggle("on", a.classList.contains("on")));
    };
    new MutationObserver(sync).observe(rail, { subtree: true, attributes: true, attributeFilter: ["class"] });
    sync();
  }
  const read = document.querySelector<HTMLDetailsElement>(".hm-read");
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const opened = target
      .closest(".tp-sheet a[href], .tp-sheet [data-set-view], .tp-sheet [data-print]")
      ?.closest<HTMLElement>(".tp-sheet");
    if (opened?.matches(":popover-open") === true) opened.hidePopover();
    if (read?.open === true && !read.contains(target)) read.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && read) read.open = false;
  });
  const index = document.getElementById("tp-index");
  index?.addEventListener("toggle", (event) => {
    if (event.newState !== "open") return;
    const body = index.querySelector(".tp-sheet-body");
    const here = [...index.querySelectorAll<HTMLElement>("a[aria-current]")].find((a) => a.offsetParent !== null);
    if (!body || !here) return;
    const a = here.getBoundingClientRect();
    const b = body.getBoundingClientRect();
    body.scrollTop += a.top - b.top - (b.height - a.height) / 2;
  });
  const wraps = [...document.querySelectorAll<HTMLElement>(".tp-card > .table-wrap")];
  const measure = (wrap: HTMLElement): void => {
    const card = wrap.parentElement;
    if (!card) return;
    if (!card.classList.contains("tp-wide")) card.classList.toggle("tp-scroll", wrap.scrollWidth > wrap.clientWidth + 1);
    card.classList.toggle("tp-end-reached", wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2);
  };
  for (const wrap of wraps) {
    wrap.addEventListener(
      "scroll",
      () => {
        measure(wrap);
      },
      { passive: true },
    );
  }
  const measureAll = (): void => {
    wraps.forEach(measure);
  };
  addEventListener("resize", measureAll);
  measureAll();
  void document.fonts.ready.then(measureAll);
}
