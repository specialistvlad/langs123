// The study-path step being read on a topic page: the step its address names, ?step=a1, while the level filter shows
// it; else the highest step at or below the filter, else the lowest. The study path's row of that step is marked
// current, and the Up next of the order by level shows the step after it.
function studyStep(root: HTMLElement): void {
  const rows = [...document.querySelectorAll<HTMLElement>(".tp-path-row")];
  const scale = [...document.querySelectorAll<HTMLElement>("#lv-pop [data-row]")].map((row) => row.dataset["row"] ?? "");
  if (rows.length === 0) return;
  const update = (): void => {
    const at = scale.indexOf(root.dataset["level"] ?? "");
    const asked = (new URL(location.href).searchParams.get("step") ?? "").toUpperCase();
    const shown = rows.filter((row) => scale.indexOf(row.dataset["level"] ?? "") <= at);
    const current = shown.find((row) => row.dataset["level"] === asked) ?? shown.pop() ?? rows[0];
    for (const row of rows) {
      if (row === current) row.setAttribute("aria-current", "step");
      else row.removeAttribute("aria-current");
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-order="path"][data-step]')) {
      el.hidden = el.dataset["step"] !== current?.dataset["level"];
    }
  };
  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ["data-level"] });
  update();
}

// A topic page (pages/topic.ts): the part being read marked in the left pane's contents follows the right pane's scroll
// (client.ts marks the parts on the window's scroll, which the right pane forwards), the contents list keeps it in
// view and the phone's sheet holds the same mark; the study path's current step follows the level filter; a sheet
// closes once a choice or a link is taken; the Read in menu closes on a tap elsewhere or Escape; and a table wider
// than its card scrolls sideways, its cut edge faded until the reader reaches it.
export function topicPage(): void {
  if (document.documentElement.dataset["page"] !== "topic") return;
  studyStep(document.documentElement);
  const pane = document.querySelector<HTMLElement>(".sp-right");
  const left = document.querySelector<HTMLElement>(".sp-left");
  pane?.addEventListener(
    "scroll",
    () => {
      dispatchEvent(new Event("scroll"));
    },
    { passive: true },
  );
  const list = left?.querySelector(".toc");
  const sheet = document.querySelector("#tp-contents .toc");
  if (left && list) {
    new MutationObserver(() => {
      const mine = sheet?.querySelectorAll("a");
      list.querySelectorAll("a").forEach((a, i) => mine?.[i]?.classList.toggle("on", a.classList.contains("on")));
      const on = list.querySelector<HTMLElement>("a.on");
      if (on === null) return;
      const at = on.getBoundingClientRect();
      const box = left.getBoundingClientRect();
      if (at.top < box.top) left.scrollTop += at.top - box.top - 8;
      else if (at.bottom > box.bottom) left.scrollTop += at.bottom - box.bottom + 8;
    }).observe(list, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const opened = target
      .closest(".tp-sheet a[href], .tp-sheet [data-set-view], .tp-sheet [data-print]")
      ?.closest<HTMLElement>(".tp-sheet");
    if (opened?.matches(":popover-open") === true) opened.hidePopover();
    for (const read of document.querySelectorAll<HTMLDetailsElement>(".hm-read[open]")) {
      if (!read.contains(target)) read.open = false;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const read of document.querySelectorAll<HTMLDetailsElement>(".hm-read")) read.open = false;
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
