// The study-path step being read on a topic page: the step its address names, ?step=a1, while the level
// filter shows it; else the highest step at or below the filter, else the lowest. The menu marks it as
// the current step, and Up next and the previous and next rows show the steps around it. Returns the update for client.ts to call on
// every change.
export function studyStep(root: HTMLElement): () => void {
  const levels = [...document.querySelectorAll<HTMLElement>(".ix-menu [data-set-level]:not([data-all])")].map(
    (b) => b.dataset["setLevel"] ?? "",
  );
  const steps = [...document.querySelectorAll<HTMLAnchorElement>('.nav-list[data-order="path"] a.on')];
  const rank = (a: HTMLElement): number => levels.indexOf(a.dataset["level"] ?? "");
  return () => {
    if (steps.length === 0) return;
    const at = levels.indexOf(root.dataset["level"] ?? "");
    const asked = (new URL(location.href).searchParams.get("step") ?? "").toUpperCase();
    const shown = steps.filter((a) => rank(a) <= at);
    const current = shown.find((a) => a.dataset["level"] === asked) ?? shown.pop() ?? steps[0];
    steps.forEach((a) => {
      if (a === current) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");
    });
    document.querySelectorAll<HTMLElement>('[data-order="path"][data-step]').forEach((el) => {
      el.hidden = el.dataset["step"] !== current?.dataset["level"];
    });
  };
}

// A study-path link opens its topic at its step: as the reader follows it (a click, a middle click, or the
// context menu's open in a new tab), its address gains ?step=a1 from data-path-step. The href in the page
// stays the topic's canonical address.
export function stepLinks(): void {
  const withStep = (e: Event): void => {
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[data-path-step]") : null;
    if (!a) return;
    const url = new URL(a.href);
    url.searchParams.set("step", a.dataset["pathStep"] ?? "");
    a.href = url.href;
  };
  for (const type of ["click", "auxclick", "contextmenu"]) document.addEventListener(type, withStep, true);
}
