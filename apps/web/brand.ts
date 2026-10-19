// The mark beside the site's name on the Home and the credits. A build's brand option draws a product's own;
// the library's is a rounded tile in the accent colour with 123 on it.
export interface Brand {
  // The mark as an SVG, size pixels square.
  mark: (size: number) => string;
}

export const LIBRARY_BRAND: Brand = {
  mark: (size) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" style="fill: var(--accent)"/><text x="14" y="18" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="800" style="fill: var(--bg)">123</text></svg>`,
};
