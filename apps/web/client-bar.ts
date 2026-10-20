// The bars on phones (topic-phone.css, track-phone.css) slide away while the reader scrolls down and come back on a
// scroll up, near the top of the page, and while a switch is open.
export function hidingBar(): void {
  const root = document.documentElement;
  let last = scrollY;
  let frame = 0;
  const update = (): void => {
    frame = 0;
    const y = scrollY;
    const open = document.querySelector(".seg.open") !== null;
    if (open || y < 60) root.classList.remove("bar-hidden");
    else if (y > last + 4) root.classList.add("bar-hidden");
    else if (y < last - 4) root.classList.remove("bar-hidden");
    // Small moves add up until they pass the threshold.
    if (open || Math.abs(y - last) > 4) last = y;
  };
  addEventListener(
    "scroll",
    () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
}
