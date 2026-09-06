import type { Page } from '@playwright/test';

/**
 * Reading a served document the way a browser reads it.
 *
 * Every reader here parses. They used to be regular expressions over the file —
 * `<script[\s\S]*?</script>`, `<[^>]+>`, `<body[^>]*>` — and each was wrong
 * about the markup it claimed to read: an attribute value holding a `>` ends a
 * tag early, and `<!-->` is a comment that closes immediately. A generated hull
 * document is a quarter of a megabyte of exactly those cases, so a journey that
 * read it by pattern was asserting something about a string rather than about a
 * page.
 *
 * Parsed in the browser rather than in the test process, with `DOMParser`: the
 * suite already has a browser open, the document under test is HTML it is built
 * to read, and nothing has to be installed to make that true. The parse is
 * inert — a `DOMParser` document runs no script, loads no subresource and is
 * never displayed — so what comes back is the file, not a page that ran.
 */

/** What a served document says, in the four ways the journeys ask. */
export interface ServedShape {
  /** Its body as text a reader can see, script and style excluded. */
  readonly text: string;
  /** Every `<h1>` it carries, in document order. */
  readonly headings: readonly string[];
  /** The element names inside `main`, in document order. */
  readonly outline: string;
  /** How many game names are disclosed as being in their original language. */
  readonly disclosures: number;
}

export function shapeOf(page: Page, source: string): Promise<ServedShape> {
  return page.evaluate((html) => {
    const parsed = new DOMParser().parseFromString(html, 'text/html');

    // Text nodes joined by a space rather than concatenated by `textContent`,
    // because a document puts a figure and its unit in separate elements: the
    // catalogue draws `220` and `m/s` as two spans, and run together they read
    // `220m/s`, which is a figure a journey would then call missing from the
    // document that plainly states it. An element boundary is a word boundary.
    const readingOrder = (root: Element): string => {
      const parts: string[] = [];
      const walk = (node: Node) => {
        for (const child of node.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            parts.push(child.nodeValue ?? '');
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const tag = (child as Element).tagName.toLowerCase();
            if (tag !== 'script' && tag !== 'style') {
              walk(child);
            }
          }
        }
      };
      walk(root);
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    };

    const main = parsed.querySelector('main');
    const disclosed = new Set(parsed.querySelectorAll('main .game-text__disclosure'));

    return {
      text: readingOrder(parsed.body),
      headings: [...parsed.querySelectorAll('h1')].map((heading) => readingOrder(heading)),
      outline: [...(main?.querySelectorAll('*') ?? [])]
        .filter((element) => !disclosed.has(element))
        .map((element) => element.tagName.toLowerCase())
        .join(','),
      disclosures: disclosed.size,
    };
  }, source);
}
