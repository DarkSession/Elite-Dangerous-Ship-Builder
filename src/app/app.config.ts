import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { RetentionService } from './application/build-library/retention.service';
import { RouteTitleStrategy } from './features/shared/route-title.strategy';
import { provideLocalization } from './i18n/i18n.providers';
import { RenderingTarget } from './platform/browser/rendering-target';
import { WEB_STORAGE_PROVIDERS } from './platform/storage/web-storage.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route parameters are bound to component inputs, so a screen takes its
    // subject as an input rather than reaching into the router for it.
    provideRouter(routes, withComponentInputBinding()),
    // Route titles are message keys resolved in the committed locale, so the
    // tab's language cannot lag the page's.
    { provide: TitleStrategy, useClass: RouteTitleStrategy },
    provideLocalization(),
    // Every browser store is reached through a port with an exception
    // boundary, so a blocked or full one changes persistence and nothing else.
    ...WEB_STORAGE_PROVIDERS,
    // One of the expiry's two moments; the other is every listing read. An
    // initializer rather than a timer, and rather than something the shell
    // component does: a record that outlives its deadline until the next start
    // costs nothing, and a row vanishing under a Commander reading the library
    // costs trust (FR-013, ruled 2026-08-25).
    //
    // Not in the build's renderer. The sweep reaches `TabOwnershipCoordinator`,
    // which takes a page nonce from `UuidAdapter`, which throws where there is
    // no `crypto` rather than fabricating an identity (constitution IV). The
    // renderer has no `crypto`, so an unguarded initializer throws before the
    // router runs and every one of the 50 documents comes out empty. What is
    // removed here is the call, not the honesty: `UuidAdapter` keeps throwing,
    // and the build simply never asks it for something a build has no use for —
    // there is no Commander at build time and no library to sweep
    // (015/FR-001, research decision 5).
    provideAppInitializer(() => {
      if (inject(RenderingTarget).isBrowser) {
        inject(RetentionService).sweep();
      }
    }),
    // The application's only service worker, and its only cache owner.
    //
    // It exists for one reason: complete English and the shell must be readable
    // with no network, and a German catalogue that has already been opened once
    // must stay readable after that (FR-019). Everything it caches is a
    // same-origin static asset; it never fetches another origin and it never
    // caches a build or any Commander data (constitution I).
    //
    // Registered immediately rather than on application stability, so the
    // controller exists at a predictable point — the offline journey has to be
    // able to say "the worker is in control" without waiting on a heuristic.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
