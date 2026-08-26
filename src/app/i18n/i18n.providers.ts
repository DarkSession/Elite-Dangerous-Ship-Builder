import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { LocaleStore } from './locale.store';

/**
 * Localization providers, shared by the product application and the tooling-only
 * preview application so both render exactly the same message boundary.
 *
 * The application's own signal store owns locale selection, catalogue
 * validation and the atomic commit of messages, direction and root document
 * state, and `interpolate` in the locale registry substitutes a message's
 * placeholders — so no second copy of the active language exists to drift out
 * of step with the committed one.
 */
export function provideLocalization(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Startup selection runs before the application renders, and is
    // deliberately not awaited. The English case commits synchronously, so the
    // root `lang` and `dir` are correct in the very first frame. A non-English
    // case leaves the complete bundled English snapshot visible while its
    // catalogue loads, rather than holding the first paint behind a request
    // that may be slow or may fail.
    provideAppInitializer(() => {
      void inject(LocaleStore).start();
    }),
  ]);
}
