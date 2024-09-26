import { extname, isAbsolute, join } from "path";
import { NSITE_KIND } from "./const.js";
import { requestEvents } from "./nostr.js";

export function getSearchPaths(path: string) {
  const paths = [path];

  // if the path does not have an extension, also look for index.html
  if (extname(path) === "") paths.push(join(path, "index.html"));

  return paths.filter((p) => !!p);
}

export function parseNsiteEvent(event: { pubkey: string; tags: string[][] }) {
  const path = event.tags.find((t) => t[0] === "d" && t[1])?.[1];
  const sha256 = event.tags.find((t) => t[0] === "x" && t[1])?.[1];

  if (path && sha256)
    return {
      pubkey: event.pubkey,
      path: join("/", path),
      sha256,
    };
}

export async function getNsiteBlobs(pubkey: string, path: string, relays: string[]) {
  // NOTE: hack, remove "/" paths since it breaks some relays
  const paths = getSearchPaths(path).filter((p) => p !== "/");
  const events = await requestEvents(relays, { kinds: [NSITE_KIND], "#d": paths, authors: [pubkey] });

  return Array.from(events)
    .map(parseNsiteEvent)
    .filter((e) => !!e)
    .sort((a, b) => paths.indexOf(a.path) - paths.indexOf(b.path));
}
