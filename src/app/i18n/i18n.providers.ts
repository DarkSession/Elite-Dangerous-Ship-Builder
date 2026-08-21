import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import {
  DefaultTranspiler,
  TRANSLOCO_CONFIG,
  TRANSLOCO_TRANSPILER,
  translocoConfig,
} from '@jsverse/transloco';
import { FALLBACK_LOCALE, SHIPPED_LOCALES } from './locale-registry';
import { LocaleStore } from './locale.store';

/**
 * Localization providers, shared by the product application and the tooling-only
 * preview application so both render exactly the same message boundary.
 *
 * Transloco is registered as the interpolation engine only. The application's
 * own signal store owns locale selection, catalogue validation and the atomic
 * commit of messages, direction and root document state, so no Transloco loader
 * or second copy of the active language exists to drift out of step with it.
 */
export function provideLocalization(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: SHIPPED_LOCALES.map((locale) => locale.tag),
        defaultLang: FALLBACK_LOCALE,
        fallbackLang: FALLBACK_LOCALE,
        // The store re-publishes the catalogue as a signal, so components
        // recompute from that rather than from an engine-level re-render.
        reRenderOnLangChange: false,
        missingHandler: {
          // A missing key is a build-time failure, caught by the repository
          // catalogue gate. At runtime the facade resolves the generic
          // unavailable message rather than echoing anything.
          logMissingKey: false,
          useFallbackTranslation: false,
          allowEmpty: false,
        },
      }),
    },
    { provide: TRANSLOCO_TRANSPILER, useClass: DefaultTranspiler },
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
