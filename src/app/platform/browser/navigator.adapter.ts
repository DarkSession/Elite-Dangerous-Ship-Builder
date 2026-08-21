import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/core';

/**
 * Read access to the browser's declared language preferences.
 *
 * The full list is read once per selection and never persisted or uploaded
 * (localization contract, "Selection precedence and persistence"). The adapter
 * returns a defensive copy so a caller cannot mutate the platform's array, and
 * tolerates a runtime that exposes neither `languages` nor `language`.
 */
@Injectable({ providedIn: 'root' })
export class NavigatorAdapter {
  readonly #window = inject(DOCUMENT).defaultView;

  /**
   * The browser's preferred languages, most preferred first.
   *
   * Blank entries are dropped: an empty tag cannot match a shipped locale, and
   * letting one through would only produce a confusing near-match later.
   */
  languages(): readonly string[] {
    const navigator = this.#window?.navigator;
    if (!navigator) {
      return [];
    }

    const declared = navigator.languages;
    const list =
      Array.isArray(declared) && declared.length > 0
        ? declared
        : navigator.language
          ? [navigator.language]
          : [];

    return list.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  }
}
