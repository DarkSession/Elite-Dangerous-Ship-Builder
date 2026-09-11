import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Whether a node is something a Commander can read.
 *
 * The framework's hydration anchors are comments and the whitespace between
 * elements is text with nothing in it. A `main` holding only those is a `main`
 * the build wrote no content into, which is every address the build generates
 * no document for — and there the shell is what was served, so there is nothing
 * to hold (`openspec/specs/platform/published-addresses/`, "What an address
 * served is held until a screen replaces it").
 */
function readable(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return true;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').trim().length > 0;
  }
  // A comment, tested by kind rather than by content: `textContent` reports a
  // comment's own words, so a hydration anchor reads as something to hold.
  return false;
}

/**
 * A copy of what the address served, taken before the application takes over.
 *
 * The build writes a document for every content-bearing address (015/FR-018),
 * so a Commander is reading that address's content before any script runs. The
 * takeover then hands the document to a screen the application presents —
 * except where no screen is presented, and there the served content has to
 * still be standing. Nothing else in the application has a view of it: by the
 * time a navigation has failed, hydration has already removed the nodes it
 * found nothing to claim them with.
 *
 * So the copy is taken first, in a browser-only application initialiser
 * registered before `provideRouter`, where the DOM is still the served document
 * and nothing has been claimed (`app.config.ts`).
 *
 * **A copy, not a detachment.** Detaching the served nodes would blank the page
 * at the moment the Commander is reading it, and would leave hydration nothing
 * to adopt when the navigation succeeds — which is the defect this exists to
 * prevent rather than to cause. The live document is not touched here at all.
 *
 * **Nodes, not a string.** A string would be parsed again, and what goes back
 * has to be what the address served rather than a second reading of it
 * (023/FR-001, "It MUST be kept as the address served it: not rebuilt, not
 * recomputed, not written again").
 *
 * It renders nothing and decides nothing. When the copy goes back, and when it
 * is dropped, is `ServedDocumentStore` — this owns the copy and the document
 * seam alone (constitution III).
 */
@Injectable({ providedIn: 'root' })
export class ServedContentAdapter {
  readonly #document = inject(DOCUMENT);

  /**
   * The served content, or `null` where the address served no content of its
   * own.
   *
   * Taken in the constructor rather than on first read, because the only moment
   * it can be taken is before the router reaches the outlet, and a lazy read
   * would take it whenever its first caller happened to ask.
   */
  readonly #copy: readonly Node[] | null = this.#take();

  /**
   * The language the document declared when it was served, or `null` where it
   * declared none.
   *
   * Read at the same moment as the nodes and for the same reason. The running
   * application writes the committed locale onto the document root
   * (`document.adapter.ts`), so by the time held content is standing the root
   * says German while the content in it is the bundled English the address
   * served. Content in a language other than the page's has to say which
   * language it is in, and this is the only moment the answer is still on the
   * document (011/FR-017, WCAG 3.1.2).
   */
  readonly #language: string | null = this.#read();

  /** The language the address served its content in, where it declared one. */
  get language(): string | null {
    return this.#language;
  }

  /** Whether anything was served that a screen would replace. */
  get held(): boolean {
    return this.#copy !== null;
  }

  /**
   * The copy, for the frame to place in its own container.
   *
   * The same nodes on every read. The frame is the only thing that renders
   * them, and it places them once.
   */
  get content(): readonly Node[] | null {
    return this.#copy;
  }

  #read(): string | null {
    const declared = this.#document.documentElement.lang.trim();
    return declared.length > 0 ? declared : null;
  }

  #take(): readonly Node[] | null {
    // The landmark rather than a class name. One `main` is what the document
    // carries (`openspec/specs/platform/accessible-responsive-operation/`,
    // "Landmarks and heading structure"), and reading the landmark keeps this
    // from breaking when the design system renames a class.
    const served = this.#document.querySelector('main');
    if (!served) {
      return null;
    }

    const nodes = Array.from(served.childNodes);
    if (!nodes.some(readable)) {
      return null;
    }
    return nodes.map((node) => node.cloneNode(true));
  }
}
