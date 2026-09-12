import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ROUTING_PROVIDERS, SERVED_DOCUMENT_INITIALIZER, appConfig } from './app.config';
import { ServedContentAdapter } from './platform/browser/served-content.adapter';

describe('appConfig', () => {
  it('provides the application-level providers used to bootstrap the app', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  /**
   * The copy of what the address served, taken before the takeover.
   *
   * Two readings, because the property has two halves and each can break on its
   * own: the copy is taken while the application starts rather than whenever
   * something first asks for it, and it is registered ahead of the router,
   * whose initial navigation is the takeover itself.
   *
   * That the copy is taken before that navigation begins is not read here, and
   * cannot be: the blocking initial navigation is production-only, and even
   * provided by hand it starts in a microtask after every initializer function
   * has run — so the copy is taken first whatever the order, and a reading of
   * it here would pass with the initializer moved. Where it can fail is the
   * production journey, which asks what the container holds after a takeover
   * that presented no screen: a copy taken after hydration had removed the
   * served nodes is an empty container, and
   * `e2e/prerendered-first-frame.spec.ts` compares that container's markup with
   * the document the address served, node for node.
   */
  describe('and what the address served', () => {
    let planted: HTMLElement | null = null;

    afterEach(() => {
      planted?.remove();
      planted = null;
    });

    function plantAServedDocument(): void {
      const served = document.createElement('main');
      served.innerHTML = '<h1>Ships</h1><ul><li>Anaconda</li></ul>';
      document.body.prepend(served);
      planted = served;
    }

    it('is registered before the router takes the document over', () => {
      // Positions rather than a comment about positions. Initializers run in
      // the order they are provided and the blocking initial navigation is
      // started from one of the router's own, so the copy's own initializer
      // moved after the router's would take the copy once hydration had already
      // removed what it was for — with nothing else in the suite failing.
      const order = appConfig.providers;

      expect(order).toContain(SERVED_DOCUMENT_INITIALIZER);
      expect(order).toContain(ROUTING_PROVIDERS);
      expect(order.indexOf(SERVED_DOCUMENT_INITIALIZER)).toBeLessThan(
        order.indexOf(ROUTING_PROVIDERS),
      );
    });

    it('is copied while the application starts, not when something first asks', () => {
      plantAServedDocument();

      let copies = 0;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...appConfig.providers,
          {
            provide: ServedContentAdapter,
            useFactory: () => {
              copies += 1;
              return new ServedContentAdapter();
            },
          },
        ],
      });

      // Instantiating the testing module is what runs the initializers, so the
      // count below is read after they have all finished and before anything
      // else in this test has asked for the adapter.
      TestBed.inject(ApplicationInitStatus);

      expect(copies, 'the copy waited for something to ask for it').toBe(1);
      expect(TestBed.inject(ServedContentAdapter).content).not.toBeNull();
    });
  });
});
