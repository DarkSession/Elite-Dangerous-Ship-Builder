/**
 * Where a hull's illustration is served from.
 *
 * The Almanac ships one `illustration.svg` per hull; the build copies them to
 * the application's own origin, so nothing here ever names another host
 * (constitution I). The symbol keeps the package's exact casing, because the
 * copied directory names are the package's own and a case-insensitive
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
  return `${ARTWORK_ROOT}/${symbol}/illustration.svg`;
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
