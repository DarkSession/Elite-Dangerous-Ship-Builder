import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTING_PROVIDERS, SERVED_DOCUMENT_INITIALIZER, appConfig } from './app.config';
import { ServedContentAdapter } from './platform/browser/served-content.adapter';

describe('appConfig', () => {
  it('provides the application-level providers used to bootstrap the app', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  /**
   * The copy of what the address served, taken before the takeover.
   *
   * Two readings, because the property has two halves and each can break on
   * its own: the copy is taken while the application starts rather than
   * whenever something first asks for it, and it is registered ahead of the
   * router, whose initial navigation is the takeover itself.
   */
  describe('and what the address served', () => {
    let planted: HTMLElement | null = null;

    afterEach(() => {
      planted?.remove();
      planted = null;
    });

    it('is registered before the router takes the document over', () => {
      // Positions rather than a comment about positions. Initializers run in
      // the order they are provided and the blocking initial navigation is
      // started from one of the router's own, so an initializer added between
      // these two entries would take the copy after hydration had already
      // removed what it was for — with nothing else in the suite failing.
      const order = appConfig.providers;

      expect(order).toContain(SERVED_DOCUMENT_INITIALIZER);
      expect(order).toContain(ROUTING_PROVIDERS);
      expect(order.indexOf(SERVED_DOCUMENT_INITIALIZER)).toBeLessThan(
        order.indexOf(ROUTING_PROVIDERS),
      );
    });

    it('is copied while the application starts, before any navigation begins', () => {
      const served = document.createElement('main');
      served.innerHTML = '<h1>Ships</h1><ul><li>Anaconda</li></ul>';
      document.body.prepend(served);
      planted = served;

      let copies = 0;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...appConfig.providers,
          // The adapter takes the copy as it is constructed, so when it was
          // constructed is what this reads. Injecting it at the end would
          // answer the same either way: the document is still standing, so a
          // copy taken too late would look like a copy taken in time.
          {
            provide: ServedContentAdapter,
            useFactory: () => {
              copies += 1;
              return new ServedContentAdapter();
            },
          },
        ],
      });

      // Instantiating the testing module is what runs the initializers, so
      // everything below is read after they have all finished.
      TestBed.inject(ApplicationInitStatus);
      const router = TestBed.inject(Router);

      expect(copies, 'nothing took the copy while the application started').toBe(1);
      expect(router.getCurrentNavigation(), 'a navigation was already running').toBeNull();
      expect(router.navigated, 'a navigation had already ended').toBe(false);
      expect(TestBed.inject(ServedContentAdapter).held).toBe(true);
    });
  });
});
