// How a built site answers an address, as a static host serves it: a folder's index.html (a folder asked for without
// its slash moves to it), a file, else the nearest missing page up the path, /uk/… taking /uk/404.html, else the
// site's own 404.html. The previews and the browser tests serve through it.
import { stat } from "node:fs/promises";
import { join, normalize } from "node:path";

export type Served = { file: string; status: 200 | 404 } | { location: string; status: 301 };

export async function served(site: string, pathname: string): Promise<Served> {
  const rel = normalize(pathname).replace(/^\/+/, "");
  const missing = async (): Promise<Served> => {
    const folders = rel.startsWith("..") ? [] : rel.split("/").slice(0, -1);
    for (let n = folders.length; n > 0; n--) {
      const near = join(site, ...folders.slice(0, n), "404.html");
      if (await Bun.file(near).exists()) return { file: near, status: 404 };
    }
    return { file: join(site, "404.html"), status: 404 };
  };
  if (rel.startsWith("..")) return missing();
  const path = join(site, rel);
  const info = await stat(path).catch(() => null);
  if (info?.isDirectory() === true) {
    if (!pathname.endsWith("/")) return { location: `${pathname}/`, status: 301 };
    const index = join(path, "index.html");
    if (await Bun.file(index).exists()) return { file: index, status: 200 };
  } else if (info?.isFile() === true) {
    return { file: path, status: 200 };
  }
  return missing();
}
