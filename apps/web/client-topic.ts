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

// The part being read, marked in the outline of a wide page and in the contents rows of a phone (pages/topic.ts): the part
// whose heading has passed the top of the reading, else the first. Choosing a part in the outline marks it at once and
// the page scrolls to it; the scroll that follows leaves the choice alone.
function followParts(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".tp-outline a, .tp-list a")];
  const ids = [...document.querySelectorAll<HTMLAnchorElement>(".tp-outline a")].map((a) => decodeURIComponent(a.hash.slice(1)));
  const parts = ids.map((id) => document.getElementById(id));
  if (links.length === 0) return;
  const mark = (at: number): void => {
    for (const a of links) {
      const on = ids.indexOf(decodeURIComponent(a.hash.slice(1))) === at;
      a.classList.toggle("on", on);
      if (on && a.closest(".tp-outline")) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
  };
  let held = false;
  let frame = 0;
  const update = (): void => {
    frame = 0;
    if (held) return;
    const first = parts.findIndex((part) => part !== null && part.offsetHeight > 0);
    // On a phone the contents hide the reading: the mark stays on the part last read.
    if (first < 0) return;
    let at = -1;
    parts.forEach((part, i) => {
      if (part !== null && part.offsetHeight > 0 && part.getBoundingClientRect().top <= 100) at = i;
    });
    mark(at < 0 ? first : at);
    const outline = document.querySelector<HTMLElement>(".tp-outline");
    const on = outline?.querySelector<HTMLElement>("a.on");
    if (outline && on && on.offsetTop + on.offsetHeight > outline.scrollTop + outline.clientHeight) outline.scrollTop = on.offsetTop;
    else if (outline && on && on.offsetTop < outline.scrollTop) outline.scrollTop = on.offsetTop;
  };
  addEventListener(
    "scroll",
    () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  addEventListener("resize", update);
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(".tp-outline a") : null;
    if (link === null) return;
    mark(ids.indexOf(decodeURIComponent(link.hash.slice(1))));
    held = true;
    const release = (): void => {
      held = false;
    };
    addEventListener("scrollend", release, { once: true });
    setTimeout(release, 900);
  });
  update();
}

// On a phone the part the address names is hidden until the reading takes the page, after the browser has chosen where to
// scroll; once the reading shows, the part is scrolled to.
function openPart(): void {
  const phone = matchMedia("(max-width: 1023px)");
  const show = (): void => {
    if (!phone.matches || location.hash.length < 2) return;
    const part = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (part?.closest(".tp-body")) {
      requestAnimationFrame(() => {
        part.scrollIntoView();
      });
    }
  };
  addEventListener("hashchange", show);
  show();
}

// On a phone Back on the reading leads to the contents: where the reader came from the contents it steps back in the
// history (the contents page as it was left), else it follows its link to the topic's own address.
function backToContents(): void {
  let fromContents = false;
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (link === null) return;
    if (link.closest(".tp-list")) fromContents = true;
    else if (link.matches(".tp-back-r") && fromContents && location.hash !== "") {
      event.preventDefault();
      history.back();
    }
  });
}

// A topic page (pages/topic.ts): the study path's current step follows the level filter; the part in view is marked; Back
// leads from the reading to the contents; and a table wider than its card scrolls sideways, its cut edge faded until the
// reader reaches it.
export function topicPage(): void {
  if (document.documentElement.dataset["page"] !== "topic") return;
  studyStep(document.documentElement);
  followParts();
  openPart();
  backToContents();
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
