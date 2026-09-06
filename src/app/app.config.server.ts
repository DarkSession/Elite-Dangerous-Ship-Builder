import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/ssr';

import { appConfig } from './app.config';

/**
 * The configuration the build renders documents with.
 *
 * The same application, with server rendering added and nothing removed. A
 * second configuration that dropped providers would be a second application to
 * keep true to the first, and a document rendered from it would state what a
 * Commander never sees.
 *
 * `provideServerRendering()` without `withRoutes(...)`: the addresses to render
 * come from `prerender.routesFile` in `angular.json`, which
 * `scripts/generate-prerender-routes.mjs` derives from the same published
 * address list the sitemap is built from. A route table declared here would be a
 * second spelling of that set for the two to disagree over
 * (`contracts/address-set.md` §4, FR-006).
 *
 * Nothing here is a server. It runs at build time and no server bundle is
 * emitted, which is what constitution 9.1.0 permits: build-time rendering is
 * allowed, per-request rendering is not.
 */
export const serverConfig: ApplicationConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],
});
