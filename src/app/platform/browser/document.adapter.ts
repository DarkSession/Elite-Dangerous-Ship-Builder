import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * The application's only writer of root document state.
 *
 * `lang`, `dir` and the document title are published together by the locale
 * store as one committed revision, so no frame can show a new language with an
 * old direction or an old title (localization contract, "Candidate validation
 * and atomic publication"). Keeping the writes behind one injected adapter is
 * what lets that commit be tested without a browser and lets a component be
 * rendered in the preview application without reaching for a global.
 */
@Injectable({ providedIn: 'root' })
export class DocumentAdapter {
  readonly #document = inject(DOCUMENT);

  /**
   * Publishes the root language, direction and title in one call.
   *
   * A caller that has nothing new to say for the title passes `null` rather
   * than a blank string, so an empty title can never be written.
   */
  commitRootState(language: string, direction: 'ltr' | 'rtl', title: string | null): void {
    const root = this.#document.documentElement;
    root.lang = language;
    root.dir = direction;
    if (title !== null && title.length > 0) {
      this.#document.title = title;
    }
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
}
