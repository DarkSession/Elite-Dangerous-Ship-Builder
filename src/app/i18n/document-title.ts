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

  return interpolate(catalogue['app.document-title'], {
    page,
    app: catalogue['app.name'],
  });
}
