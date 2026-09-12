import { TestBed } from '@angular/core/testing';
import { ServedContentAdapter } from './served-content.adapter';

/**
 * The copy, taken from the document as the address served it.
 *
 * Every case here is about the moment before the application exists, so the
 * document is arranged first and the adapter injected second — which is the
 * order the initializer gives it in `app.config.ts`.
 */
describe('ServedContentAdapter', () => {
  let planted: HTMLElement | null = null;

  function serve(html: string): HTMLElement {
    const main = document.createElement('main');
    main.innerHTML = html;
    document.body.prepend(main);
    planted = main;
    return main;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    planted?.remove();
    planted = null;
  });

  it('copies the content the address served', () => {
    serve('<h1>Ships</h1><ul><li>Anaconda</li></ul>');

    const adapter = TestBed.inject(ServedContentAdapter);

    expect(adapter.content).not.toBeNull();
    const copied = adapter.content ?? [];
    const text = copied.map((node) => node.textContent ?? '').join(' ');

    expect(text).toContain('Anaconda');
  });

  it('holds nothing where the address served no content of its own', () => {
    // A landmark with nothing in it but whitespace and the framework's own
    // comment anchors. An implementation reading child count rather than
    // content would hold that and put an empty frame back over the page.
    //
    // Not the shape the build writes today: an address it generates no document
    // for answers with a document that has no `main` at all, which is the next
    // test, and a generated `main` opens with the outlet element. This is the
    // reading that keeps the rule about content rather than about a shape the
    // build happens to produce.
    serve('\n  <!--container-->\n  ');

    const adapter = TestBed.inject(ServedContentAdapter);

    expect(adapter.content).toBeNull();
  });

  it('holds nothing where the document has no main at all', () => {
    const adapter = TestBed.inject(ServedContentAdapter);

    expect(adapter.content).toBeNull();
  });

  it('reads the language the document declared when it was served', () => {
    // The one moment the answer is still on the document: the running
    // application writes the committed locale onto the root, so by the time the
    // copy is standing the root says German over content in bundled English
    // (011/FR-017, WCAG 3.1.2).
    const declared = document.documentElement.lang;
    document.documentElement.lang = 'en';
    serve('<h1>Ships</h1>');

    try {
      expect(TestBed.inject(ServedContentAdapter).language).toBe('en');
    } finally {
      document.documentElement.lang = declared;
    }
  });

  it('reads no language where the document declared none', () => {
    const declared = document.documentElement.lang;
    document.documentElement.lang = '   ';
    serve('<h1>Ships</h1>');

    try {
      expect(TestBed.inject(ServedContentAdapter).language).toBeNull();
    } finally {
      document.documentElement.lang = declared;
    }
  });

  it('measures the box the content was served in', () => {
    // The measurement the frame stands the copy in. Taken from the served
    // document while it is the only thing on the page, because the shell
    // stretches a screen shorter than the window and a box measured from the
    // copy's own content closes higher up the page than it was served
    // (023/FR-001, 015/FR-009).
    const served = serve('<h1>Ships</h1>');
    served.getBoundingClientRect = () => ({ height: 512 }) as DOMRect;

    expect(TestBed.inject(ServedContentAdapter).height).toBe(512);
  });

  it('measures nothing where the document has no main at all', () => {
    expect(TestBed.inject(ServedContentAdapter).height).toBeNull();
  });

  it('drops the copy when it is released', () => {
    // What ends the hold, and the only thing that does. The nodes go with the
    // offer of them, because a clone of the served document kept for the life
    // of the page is memory spent on a page nothing can return the Commander to
    // (023/FR-001).
    const served = serve('<h1>Ships</h1><ul><li>Anaconda</li></ul>');
    const adapter = TestBed.inject(ServedContentAdapter);

    adapter.release();

    expect(adapter.content).toBeNull();
    // And the document the Commander is on is not what was dropped.
    expect(served.textContent).toContain('Anaconda');
  });

  it('leaves the live nodes where they are', () => {
    // A copy rather than a detachment: the Commander is reading this document
    // while the copy is taken, and hydration has to find the same nodes it
    // would have found.
    const served = serve('<h1>Ships</h1><ul><li>Anaconda</li></ul>');
    const before = served.innerHTML;

    const adapter = TestBed.inject(ServedContentAdapter);

    expect(served.innerHTML).toBe(before);
    expect(served.childNodes.length).toBeGreaterThan(0);
    expect(adapter.content?.[0]).not.toBe(served.childNodes[0]);
  });
});
