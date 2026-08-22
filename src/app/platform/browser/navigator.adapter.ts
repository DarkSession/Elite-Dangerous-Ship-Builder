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

  /**
   * Puts text on the clipboard, reporting whether it actually happened.
   *
   * Clipboard access is a permission, and a permission can be refused, absent
   * or unavailable outside a secure context. Every one of those is an ordinary
   * outcome rather than an exception to propagate: the caller keeps the text on
   * screen and says so (FR-019).
   */
  async copyText(text: string): Promise<boolean> {
    const clipboard = this.#window?.navigator?.clipboard;
    if (!clipboard) {
      return false;
    }
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Whether this is an Apple platform, for naming a modifier key.
   *
   * Used for one thing: writing `⌘K` where that is the key and `Ctrl + K`
   * everywhere else. It decides no capability and gates no feature — a hint
   * naming the wrong key is a small confusion, and treating the answer as a
   * capability test would be the browser-sniffing this adapter exists to keep
   * out of components.
   *
   * `userAgentData.platform` is the modern answer and `platform` the fallback;
   * a runtime that offers neither is not Apple as far as a hint is concerned.
   */
  applePlatform(): boolean {
    const navigator = this.#window?.navigator as
      (Navigator & { userAgentData?: { platform?: string } }) | undefined;
    const declared = navigator?.userAgentData?.platform ?? navigator?.platform ?? '';
    return /mac|iphone|ipad|ipod/i.test(declared);
  }

  /** Whether this platform offers a share sheet at all. */
  canShare(): boolean {
    return typeof this.#window?.navigator?.share === 'function';
  }

  /**
   * Opens the platform share sheet.
   *
   * A Commander who dismisses the sheet cancels the share, and the rejection
   * that reports it is indistinguishable from a failure. Both return false,
   * because both mean the same thing here: the link did not leave this way, so
   * the one on screen is still the way out.
   */
  async share(payload: { title: string; url: string }): Promise<boolean> {
    const navigator = this.#window?.navigator;
    if (typeof navigator?.share !== 'function') {
      return false;
    }
    try {
      await navigator.share(payload);
      return true;
    } catch {
      return false;
    }
  }
}
