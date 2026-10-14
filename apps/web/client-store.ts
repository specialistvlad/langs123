// The browser's storage for the reader's choices; with storage off, a choice lasts for the page alone.
export const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage is off: the preference lasts for this page only.
    }
  },
};
