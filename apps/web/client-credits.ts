// The credits' copy button (pages/credits.ts), on the credits page and where the Home's right pane shows the credits: it
// copies the credit line, shows a tick for a moment and says Copied to screen readers. Without clipboard permission it
// selects the line and copies the selection.
async function copy(line: HTMLElement, text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const range = document.createRange();
    range.selectNodeContents(line);
    const selection = getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the fallback where the clipboard API is refused
    return document.execCommand("copy");
  }
}

export function creditsCopy(): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>("#cr-copy") : null;
    const line = document.getElementById("cr-credit");
    const live = document.getElementById("cr-live");
    if (button === null || line === null) return;
    void copy(line, line.textContent.trim()).then((done) => {
      if (!done) return;
      clearTimeout(timer);
      button.classList.add("done");
      button.setAttribute("aria-label", button.dataset["copied"] ?? "");
      if (live) live.textContent = button.dataset["copied"] ?? "";
      timer = setTimeout(() => {
        button.classList.remove("done");
        button.setAttribute("aria-label", button.dataset["copy"] ?? "");
        if (live) live.textContent = "";
      }, 1800);
    });
  });
}
