// The credits page's copy button (pages/credits.ts): it copies the credit line, shows a tick for a moment and
// says Copied to screen readers. Without clipboard permission it selects the line and copies the selection.
export function creditsCopy(): void {
  const button = document.getElementById("cr-copy");
  const line = document.getElementById("cr-credit");
  const live = document.getElementById("cr-live");
  if (!button || !line) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const copy = async (text: string): Promise<boolean> => {
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
  };
  button.addEventListener("click", () => {
    void copy(line.textContent.trim()).then((done) => {
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
