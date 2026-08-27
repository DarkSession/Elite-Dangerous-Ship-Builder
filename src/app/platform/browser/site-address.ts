/**
 * Where this application is published, and how a route becomes an address.
 *
 * One constant, because four files have to agree on it: `src/index.html`'s
 * static head, `public/robots.txt`, `public/sitemap.xml` and every canonical
 * link the running application writes. The policy checker compares all four
 * against this value, so a move to a different domain is one edit and a failing
 * build everywhere it was not carried through.
 *
 * **Why a constant rather than `location.origin`.** A canonical link built from
 * wherever the document happens to be served makes every pull-request preview
 * canonical to itself, which is the duplicate a canonical exists to collapse.
 * Built from this, a preview and a development server both say the production
 * address — a statement about where the page *is* that is false in exactly the
 * two places where the truth is useless (see `design/search-visibility.md`).
 */
export const SITE_ORIGIN = 'https://sb.edct.dev';

/**
 * The canonical address of a route.
 *
 * Query and fragment are dropped rather than carried. The fragment is where a
 * build actually lives (001/FR-015), so carrying it would mint one canonical
 * address per build and undo the whole point; and neither ever reaches a server
 * to be crawled in the first place.
 *
 * A path that is empty, or is the bare root, resolves to the origin's own root
 * rather than to a trailing-slash variant of it, so the redirect target and the
 * home page are one address rather than two.
 */
export function canonicalAddress(path: string): string {
  const address = path.split('#')[0].split('?')[0];
  const trimmed = address.replace(/\/+$/, '');

  if (trimmed === '' || trimmed === '/') {
    return `${SITE_ORIGIN}/`;
  }

  return `${SITE_ORIGIN}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}
