// The split view's states (split.ts has the contract): the list button steps the left pane equal (half the window,
// or the width a drag chose) -> slim (320px) -> hidden -> equal and names the next step; the divider drags on a wide
// screen and moves with the arrow keys; the state and the width are the reader's, kept in the site's store.
import { openItems } from "./client-split-open.ts";
import { store } from "./client-store.ts";

const NEXT: Record<string, string> = { equal: "slim", slim: "hidden", hidden: "equal" };
// The left pane keeps 280px and the right pane 320px.
const LEFT_MIN = 280;
const RIGHT_MIN = 320;

export function splitView(): void {
  const sp = document.querySelector<HTMLElement>(".sp");
  if (sp === null) return;
  const buttons = [...sp.querySelectorAll<HTMLElement>("[data-sp-list]")];
  const div = sp.querySelector<HTMLElement>("[data-sp-div]");
  const left = sp.querySelector<HTMLElement>(".sp-left");

  // A state: shown, kept, and named on the button for the step after it.
  function apply(state: string): void {
    sp?.setAttribute("data-split", state);
    store.set("ln-split", state);
    for (const button of buttons) {
      const label = (JSON.parse(button.dataset["spLabels"] ?? "{}") as Record<string, string>)[state] ?? "";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    }
  }
  apply(sp.dataset["split"] === "slim" || sp.dataset["split"] === "hidden" ? sp.dataset["split"] : "equal");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      apply(NEXT[sp.dataset["split"] ?? "equal"] ?? "equal");
    });
  }

  // The left pane's width as a share of the window, kept within what each pane needs.
  function resize(share: number, keep: boolean): void {
    if (sp === null) return;
    const width = sp.getBoundingClientRect().width;
    const at = Math.min(Math.max(share, LEFT_MIN / width), 1 - RIGHT_MIN / width);
    sp.style.setProperty("--sp-w", `${String(Math.round(at * 1000) / 10)}%`);
    sp.setAttribute("data-split", "equal");
    if (keep) {
      store.set("ln-split-w", at.toFixed(3));
      store.set("ln-split", "equal");
    }
  }
  if (div !== null && left !== null) {
    const share = (): number => left.getBoundingClientRect().width / sp.getBoundingClientRect().width;
    div.addEventListener("pointerdown", (event) => {
      div.setPointerCapture(event.pointerId);
      sp.classList.add("sp-drag");
    });
    div.addEventListener("pointermove", (event) => {
      if (div.hasPointerCapture(event.pointerId)) {
        const box = sp.getBoundingClientRect();
        resize((event.clientX - box.left) / box.width, false);
      }
    });
    div.addEventListener("pointerup", () => {
      sp.classList.remove("sp-drag");
      resize(share(), true);
    });
    div.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowLeft" ? -0.02 : event.key === "ArrowRight" ? 0.02 : 0;
      if (step === 0) return;
      event.preventDefault();
      resize(share() + step, true);
    });
  }
  openItems(sp);
}
