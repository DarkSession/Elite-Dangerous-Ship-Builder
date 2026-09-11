import { TestBed } from '@angular/core/testing';
import { ServedContentAdapter } from './served-content.adapter';

/**
 * The copy, taken from the document as the address served it.
 *
 * Every case here is about the moment before the application exists, so the
 * document is arranged first and the adapter injected second — which is the
 * order the initialiser gives it in `app.config.ts`.
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

    expect(adapter.held).toBe(true);
    const copied = adapter.content ?? [];
    const text = copied.map((node) => node.textContent ?? '').join(' ');

    expect(text).toContain('Anaconda');
  });

  it('holds nothing where the address served no content of its own', () => {
    // The shell, which is what every address the build generates no document
    // for answers with. Whitespace and the framework's own comment anchors are
    // not content, so an implementation reading child count rather than content
    // would hold an empty frame and put it back over the shell.
    serve('\n  <!--container-->\n  ');

    const adapter = TestBed.inject(ServedContentAdapter);

    expect(adapter.held).toBe(false);
    expect(adapter.content).toBeNull();
  });

  it('holds nothing where the document has no main at all', () => {
    const adapter = TestBed.inject(ServedContentAdapter);

    expect(adapter.held).toBe(false);
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
