import { type Provider } from '@angular/core';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { NavigatorAdapter } from '../../platform/browser/navigator.adapter';

/**
 * Test-only isolation for the localization layer.
 *
 * A test that uses the production providers otherwise touches the real
 * `navigator` and the real document, so one spec's startup changes what the
 * next spec sees. These doubles keep each
 * test's locale state its own, and make the browser's declared languages
 * something a test states rather than something the runner happens to have.
 *
 * Not registered by any production configuration.
 */

/** A root document that records nothing and writes nothing. */
export class SilentDocumentAdapter {
  commitRootState(): void {}
}

/** A browser whose declared languages the test states. */
export class StaticNavigatorAdapter {
  constructor(private readonly tags: readonly string[] = ['en']) {}

  languages(): readonly string[] {
    return this.tags;
  }
}

/** Providers isolating a test's locale state from the machine it runs on. */
export function provideIsolatedLocaleEnvironment(options?: {
  browserLanguages?: readonly string[];
}): Provider[] {
  return [
    { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
    {
      provide: NavigatorAdapter,
      useValue: new StaticNavigatorAdapter(options?.browserLanguages ?? ['en']),
    },
  ];
}
