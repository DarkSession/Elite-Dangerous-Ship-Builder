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
import { SLEF_FALLBACK_PROVIDER } from './application/slef/slef-fallback.adapter';
import { provideLocalization } from './i18n/i18n.providers';
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
    // Feature 001 declares the seam a link refusal reaches for; feature 004
    // is what it reaches.
    SLEF_FALLBACK_PROVIDER,
    // Every browser store is reached through a port with an exception
    // boundary, so a blocked or full one changes persistence and nothing else.
    ...WEB_STORAGE_PROVIDERS,
    // One of the expiry's two moments; the other is every listing read. An
    // initializer rather than a timer, and rather than something the shell
    // component does: a record that outlives its deadline until the next start
    // costs nothing, and a row vanishing under a Commander reading the library
    // costs trust (FR-013, ruled 2026-08-25).
    provideAppInitializer(() => {
      inject(RetentionService).sweep();
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
