import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { provideLocalization } from './i18n/i18n.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideLocalization(),
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
