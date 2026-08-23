/**
 * Where a hull's illustration is served from.
 *
 * The Almanac ships one `illustration.svg` per hull. Those are rasterised to
 * PNG by `scripts/convert-ship-artwork.mjs` and committed under `public/`, so
 * the served files are this application's own and nothing here ever names
 * another host (constitution I). The symbol keeps the package's exact casing,
 * because the directory names are the package's own and a case-insensitive
 * filesystem in development would otherwise hide a 404 that production returns.
 */
const ARTWORK_ROOT = 'assets/ships';

/**
 * The path to one hull's illustration, relative to the deployment base.
 *
 * Relative rather than absolute: this application is deployed under a sub-path,
 * and a leading slash would resolve to the host root and miss every image.
 * Callers that need an absolute URL join it with the document base.
 */
export function hullArtworkPath(symbol: string): string {
  return `${ARTWORK_ROOT}/${symbol}/illustration.png`;
}

/**
 * The same path resolved against a deployment base href.
 *
 * `baseHref` is whatever the document declares — `/`, `/ship-builder/`, or an
 * absolute URL. A base without a trailing slash is treated as a directory, the
 * way `<base>` resolution does not, because that is the mistake a deployment
 * configuration most often makes and silently returning every image from the
 * parent directory is a hard bug to see.
 */
export function hullArtworkUrl(symbol: string, baseHref: string): string {
  const base = baseHref.endsWith('/') ? baseHref : `${baseHref}/`;
  return `${base}${hullArtworkPath(symbol)}`;
}

/**
 * The path to one of a hull's two schematics, as the mounts on it.
 *
 * The Almanac's own `schematic-<side>.svg` is never fetched. It is ninety
 * kilobytes of sub-pixel path data, and what a plate needs out of it is the
 * drawing's box, the rectangle it draws in and the middle of each annotated
 * mount — a few hundred bytes, extracted from the installed package by
 * `scripts/extract-schematic-mounts.mts` and committed beside the illustration.
 * The application still keeps no geometry of its own: the extract is
 * reproducible from the package and `pnpm run policy` fails if it was made from
 * a different file than the installed one (feature 010, FR-009).
 *
 * The symbol is URI-encoded as one path segment, so nothing a symbol could
 * contain can climb out of the artwork root or name another host.
 */
export function hullSchematicPath(symbol: string, side: 'top' | 'bottom'): string {
  return `${ARTWORK_ROOT}/${encodeURIComponent(symbol)}/schematic-${side}.json`;
}

/**
 * The path to the same schematic as a picture.
 *
 * The extract above is what the application *reads*; this is what the plate
 * *draws*. The same package document rasterised by
 * `scripts/convert-ship-artwork.mjs`, drawn inside the `viewBox` the extract
 * carries, so the picture and the marks over it share one coordinate space and
 * neither can drift from the other.
 */
export function hullSchematicImagePath(symbol: string, side: 'top' | 'bottom'): string {
  return `${ARTWORK_ROOT}/${encodeURIComponent(symbol)}/schematic-${side}.png`;
}
