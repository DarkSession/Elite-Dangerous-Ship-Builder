import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Everything about the document that changes when the route or the language does.
 *
 * One object rather than five arguments, because every field is published in
 * the same commit and a caller that could supply three of them would eventually
 * supply three of them.
 */
export interface RootDocumentState {
  /** The committed locale's BCP 47 tag, written to root `lang`. */
  readonly language: string;
  /** The committed locale's writing direction, written to root `dir`. */
  readonly direction: 'ltr' | 'rtl';
  /** The document title. `null` leaves the standing title alone. */
  readonly title: string | null;
  /**
   * What this page is, for a search result's snippet and a link preview.
   *
   * Resolved from the same catalogue as the title, so the two are never in
   * different languages.
   */
  readonly description: string;
  /**
   * The production address of this route, fragment- and query-free.
   *
   * Built by `canonicalAddress` from the site's own origin rather than from
   * `location`, so a preview deployment points search engines at the page that
   * should rank rather than at itself.
   */
  readonly canonical: string;
}

/**
 * The application's only writer of root document state.
 *
 * `lang`, `dir`, the document title and the search metadata that restates them
 * are published by the locale store as one committed revision, so no frame can
 * show a new language with an old direction, an old title, or a description in
 * the language before last (localization contract, "Candidate validation and
 * atomic publication"). Keeping the writes behind one injected adapter is what
 * lets that commit be tested without a browser and lets a component be rendered
 * in the preview application without reaching for a global.
 *
 * The head tags are found first and created only when missing. `index.html`
 * ships every one of them with its English defaults, so on the real application
 * this only ever rewrites; the creation path is what makes the adapter work in
 * the preview application and in a unit test, where no such document exists.
 */
@Injectable({ providedIn: 'root' })
export class DocumentAdapter {
  readonly #document = inject(DOCUMENT);

  /**
   * Publishes the root language, direction, title and search metadata in one call.
   *
   * A caller that has nothing new to say for the title passes `null` rather
   * than a blank string, so an empty title can never be written. A blank
   * description is likewise left alone rather than published: an empty
   * `<meta name="description">` is worse than none, because a search engine
   * reads it as the page having nothing to say.
   */
  commitRootState(state: RootDocumentState): void {
    const root = this.#document.documentElement;
    root.lang = state.language;
    root.dir = state.direction;

    const title = state.title !== null && state.title.length > 0 ? state.title : this.title;
    if (state.title !== null && state.title.length > 0) {
      this.#document.title = state.title;
    }

    if (state.description.length > 0) {
      this.#meta('name', 'description', state.description);
      this.#meta('property', 'og:description', state.description);
      this.#meta('name', 'twitter:description', state.description);
    }

    this.#meta('property', 'og:title', title);
    this.#meta('name', 'twitter:title', title);
    this.#meta('property', 'og:url', state.canonical);
    this.#meta('property', 'og:locale', state.language);
    this.#canonical(state.canonical);
  }

  get language(): string {
    return this.#document.documentElement.lang;
  }

  get direction(): string {
    return this.#document.documentElement.dir;
  }

  get title(): string {
    return this.#document.title;
  }

  /** Writes one `<meta>`, adding it to the head when the document has none. */
  #meta(attribute: 'name' | 'property', key: string, content: string): void {
    const selector = `meta[${attribute}="${key}"]`;
    let element = this.#document.head.querySelector<HTMLMetaElement>(selector);
    if (element === null) {
      element = this.#document.createElement('meta');
      element.setAttribute(attribute, key);
      this.#document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  /** Writes the canonical link, adding it to the head when the document has none. */
  #canonical(address: string): void {
    let element = this.#document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (element === null) {
      element = this.#document.createElement('link');
      element.setAttribute('rel', 'canonical');
      this.#document.head.appendChild(element);
    }
    element.setAttribute('href', address);
  }
}
