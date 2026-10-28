// A draft of the review preview in the browser (pages/review.ts): it draws the draft in the language the address names,
// ?lang=<code>, the course's own where it names none the topic has, and opens a wide table in Full screen.
import { draft, languagesOf, type ReviewData } from "./review-view.ts";

function start(): void {
  const host = document.getElementById("rv");
  const raw = document.getElementById("rv-data")?.textContent;
  if (host === null || raw === undefined) return;
  const data = JSON.parse(raw) as ReviewData;
  const asked = new URL(location.href).searchParams.get("lang") ?? "";
  host.innerHTML = draft(data, languagesOf(data.topic, data.source).includes(asked) ? asked : data.source);
  host.addEventListener("click", (event) => {
    const full = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-full]") : null;
    const dialog = full === null ? null : document.getElementById(`full-${full.dataset["full"] ?? ""}`);
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
  });
}

if (typeof document !== "undefined") start();
