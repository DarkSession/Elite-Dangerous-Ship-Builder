import { interpolate, type MessageCatalogue } from './locale-registry';

/**
 * The document title, resolved from the committed catalogue.
 *
 * Kept as one pure function because two callers need exactly the same answer:
 * the locale store, which writes the title in the same commit as `lang` and
 * `dir` so the three can never disagree, and the message facade, which offers
 * the string to anything that needs to display it. A second implementation
 * would eventually produce a title in one language under a root `lang` in
 * another, which is the failure the atomic commit exists to prevent.
 */
export function resolveDocumentTitle(catalogue: MessageCatalogue, page: string | null): string {
  const application = catalogue['app.document-title.default'];

  if (page === null || page.trim().length === 0) {
    return application;
  }

  // The landing screen is named after the product, so composing it would
  // publish `Ship Builder · Elite Dangerous Ship Builder` — the product name
  // twice, on the one address `/` redirects to and the sitemap ranks highest.
  // A search result that repeats itself is the very thing a per-route title is
  // for, so a page whose name the application name already contains publishes
  // the application name alone.
  if (namesTheApplication(page, catalogue['app.name'])) {
    return application;
  }

  return interpolate(catalogue['app.document-title'], {
    page,
    app: catalogue['app.name'],
  });
}

/**
 * Whether the application name already says what this page is called.
 *
 * On whole words rather than on substrings, because `Build` sits inside
 * `Builder`: a plain `includes` would collapse the workspace's title into the
 * product name and lose the one word that says which screen it is.
 *
 * The boundary is "not a letter and not a digit" rather than `\b`, which is
 * defined on the ASCII word characters and finds an edge wherever one meets a
 * letter it does not know. In an application named `Bauübersicht`, `\b` sees a
 * boundary between `u` and `ü` and so reads `übersicht` as a whole word of it,
 * collapsing a page title that shares no word with the name at all. The
 * character class knows the letter and finds no edge.
 */
function namesTheApplication(page: string, application: string): boolean {
  const name = page.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const edge = '[^\\p{L}\\p{N}]';
  return new RegExp(`(^|${edge})${name}($|${edge})`, 'iu').test(application);
}
