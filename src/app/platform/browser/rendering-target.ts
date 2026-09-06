import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Whether this code is running in a browser or in the build's renderer.
 *
 * The application is rendered twice: once by the build, to produce the document
 * each address answers with, and once by the browser that takes over from it
 * (feature 015). Almost nothing needs to tell the two apart — the whole point of
 * `contracts/prerendered-document.md` is that the same components render the
 * same screen either way. Two things do, and both fail loudly rather than
 * quietly, which is why this exists.
 *
 * **Why `PLATFORM_ID` and not `DOCUMENT.defaultView`.** Every other platform
 * adapter here asks `inject(DOCUMENT).defaultView`, and that is the right
 * question for them: they want a window to call something on. It is the wrong
 * question for this one. The renderer's DOM emulation *provides* `defaultView`,
 * so the check passes and the code runs on — and then reaches for `crypto`,
 * which the emulation does not provide, and throws. That was tried during the
 * spike and did not work (research decision 5).
 *
 * `PLATFORM_ID` asks what is actually being asked: which platform is this. It is
 * the only place in this repository that reads it, so a component that wants the
 * answer injects this rather than reaching for the token — the same rule every
 * other browser capability here follows (constitution III).
 */
@Injectable({ providedIn: 'root' })
export class RenderingTarget {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * True in a browser; false while the build is rendering a document.
   *
   * Read it to *skip* work that has no meaning at build time — a stored record,
   * an identity, a measurement. Never read it to render something different:
   * a document that stated one thing and a browser that stated another is the
   * hydration mismatch FR-009 forbids.
   */
  get isBrowser(): boolean {
    return this.#isBrowser;
  }
}
