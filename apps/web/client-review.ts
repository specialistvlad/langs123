// A draft of the review preview in the browser (pages/review.ts): it draws the draft in the language the address names,
// ?lang=<code>, the course's own where it names none the topic has; the switch draws another and writes it in the address,
// and a wide table opens in Full screen.
import { draft, languagesOf, type ReviewData, titleIn } from "./review-view.ts";

function start(): void {
  const host = document.getElementById("rv");
  const raw = document.getElementById("rv-data")?.textContent;
  if (host === null || raw === undefined) return;
  const data = JSON.parse(raw) as ReviewData;
  const show = (language: string): void => {
    host.innerHTML = draft(data, language);
    const title = document.getElementById("rv-title");
    if (title !== null) title.textContent = titleIn(data, language);
  };
  const asked = new URL(location.href).searchParams.get("lang") ?? "";
  show(languagesOf(data.topic).includes(asked) ? asked : data.source);
  host.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const tab = target?.closest<HTMLElement>("[data-lang]");
    const full = target?.closest<HTMLElement>("[data-full]");
    if (tab) {
      const language = tab.dataset["lang"] ?? data.source;
      history.replaceState(null, "", `?lang=${language}`);
      show(language);
    } else if (full) {
      const dialog = document.getElementById(`full-${full.dataset["full"] ?? ""}`);
      if (dialog instanceof HTMLDialogElement) dialog.showModal();
    }
  });
}

if (typeof document !== "undefined") start();
