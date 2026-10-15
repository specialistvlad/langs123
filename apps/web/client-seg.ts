// The menus that open in place in the top bar (the language a page is read in, and the language to learn
// in the breadcrumb): each is a details element, and a tap elsewhere or Escape closes it.
const MENUS = "details.lang-menu[open], details.crumb-menu[open]";

export function closingMenus(): void {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const menu = target.closest("details");
      document.querySelectorAll(MENUS).forEach((d) => {
        if (d !== menu) d.removeAttribute("open");
      });
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(MENUS).forEach((d) => {
      d.removeAttribute("open");
    });
  });
}
