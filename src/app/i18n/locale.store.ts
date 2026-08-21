import { Injectable, computed, inject, signal } from '@angular/core';
import { TRANSLOCO_TRANSPILER, type TranslocoTranspiler } from '@jsverse/transloco';
import { DocumentAdapter } from '../platform/browser/document.adapter';
import { NavigatorAdapter } from '../platform/browser/navigator.adapter';
import { CatalogueLoader } from './catalogue-loader';
import { resolveDocumentTitle } from './document-title';
import {
  BUNDLED_ENGLISH,
  FALLBACK_LOCALE,
  type LocaleCandidate,
  type LocaleFailureCode,
  type LocaleSelectionSource,
  type LocaleSnapshot,
  type MessageCatalogue,
  type ShippedLocale,
  fallbackLocale,
  findShippedLocale,
  isShippedLocale,
  resolveShippedLocale,
} from './locale-registry';

/**
 * The application's locale state.
 *
 * The store owns exactly one thing: which complete catalogue is currently
 * published, and the root document state that must change with it. Everything a
 * snapshot describes — messages, effective locale, direction, title language —
 * is published in a single commit, so the interface can never render a German
 * label under an English root `lang`, or half a switch (localization contract,
 * "Candidate validation and atomic publication").
 *
 * A locale change is presentation-only. It cannot mutate an active build, a
 * build revision, a URL, a SLEF payload, a saved record or undo history
 * (constitution IV).
 *
 * The browser language setting is the only input and the application stores
 * nothing of its own, so the snapshot is derived fresh on every start.
 */
@Injectable({ providedIn: 'root' })
export class LocaleStore {
  readonly #document = inject(DocumentAdapter);
  readonly #navigator = inject(NavigatorAdapter);
  readonly #loader = inject(CatalogueLoader);
  readonly #transpiler = inject<TranslocoTranspiler>(TRANSLOCO_TRANSPILER);

  readonly #snapshot = signal<LocaleSnapshot>(bootstrapSnapshot());

  /** True only while a candidate is being loaded. The prior snapshot stays visible. */
  readonly #loading = signal(false);

  /** The page name the route contributes to the document title. */
  readonly #page = signal<string | null>(null);

  /** The current committed locale state. Always complete, always usable. */
  readonly snapshot = this.#snapshot.asReadonly();

  /** True while a secondary catalogue is in flight. */
  readonly loading = this.#loading.asReadonly();

  /** The page name currently contributing to the document title. */
  readonly page = this.#page.asReadonly();

  readonly catalogue = computed<MessageCatalogue>(() => this.#snapshot().catalogue);
  readonly effectiveLocale = computed(() => this.#snapshot().effectiveLocale);
  readonly requestedLocale = computed(() => this.#snapshot().requestedLocale);
  readonly direction = computed(() => this.#snapshot().direction);
  readonly status = computed(() => this.#snapshot().status);
  readonly fallbackReason = computed(() => this.#snapshot().fallbackReason);
  readonly revision = computed(() => this.#snapshot().revision);

  /**
   * Publishes the bundled English catalogue as a complete ready snapshot.
   *
   * English needs no runtime request, so this commit is always available and
   * always succeeds — it is what makes "readable without a network" true
   * (FR-019).
   */
  commitBundledEnglish(source: LocaleSelectionSource = 'default'): LocaleSnapshot {
    return this.#commit({
      requestedLocale: FALLBACK_LOCALE,
      effectiveLocale: FALLBACK_LOCALE,
      selectionSource: source,
      catalogue: BUNDLED_ENGLISH,
      direction: fallbackLocale().direction,
      status: 'ready',
      fallbackReason: null,
    });
  }

  /**
   * Publishes bundled English as the effective locale after a requested locale
   * could not be used.
   *
   * The snapshot records what was asked for and why it failed, so the shell can
   * say so once and offer a retry. It is a `fallback`, not a `ready`, state —
   * both are readable, and only one of them is what the Commander asked for.
   */
  commitFallbackToEnglish(
    requestedLocale: string,
    reason: LocaleFailureCode,
    source: LocaleSelectionSource,
  ): LocaleSnapshot {
    return this.#commit({
      requestedLocale,
      effectiveLocale: FALLBACK_LOCALE,
      selectionSource: source,
      catalogue: BUNDLED_ENGLISH,
      direction: fallbackLocale().direction,
      status: 'fallback',
      fallbackReason: reason,
    });
  }

  /**
   * Publishes a validated candidate as the effective locale.
   *
   * A candidate carrying no catalogue, or naming a locale this build does not
   * ship, commits the English fallback instead of publishing anything partial.
   */
  commitCandidate(candidate: LocaleCandidate, source: LocaleSelectionSource): LocaleSnapshot {
    const locale = findShippedLocale(candidate.requested);
    if (!locale || candidate.catalogue === null) {
      return this.commitFallbackToEnglish(
        candidate.requested,
        candidate.failure ?? (locale ? 'invalid-catalogue' : 'unknown-locale'),
        source,
      );
    }

    return this.#commit({
      requestedLocale: candidate.requested,
      effectiveLocale: locale.tag,
      selectionSource: source,
      catalogue: candidate.catalogue,
      direction: locale.direction,
      status: 'ready',
      fallbackReason: null,
    });
  }

  /** Marks a candidate load as in flight without disturbing the current snapshot. */
  setLoading(loading: boolean): void {
    this.#loading.set(loading);
  }

  /**
   * Sets the page name the document title names, and republishes the title.
   *
   * The route owns the page name; the store owns how it is combined with the
   * application name and in which language.
   */
  setPage(page: string | null): void {
    this.#page.set(page);
    const snapshot = this.#snapshot();
    this.#document.commitRootState(
      snapshot.effectiveLocale,
      snapshot.direction,
      this.#title(snapshot.catalogue),
    );
  }

  /**
   * Chooses the startup locale and publishes it.
   *
   * Precedence is the browser's declared languages, then bundled English
   * (FR-017). English is committed synchronously because it needs no request;
   * any other locale leaves the complete bundled catalogue visible while its
   * own loads, so there is no frame without messages and no frame with half a
   * language.
   *
   * An unsupported browser language therefore issues **no** locale request at
   * all: the answer is already in the bundle.
   */
  async start(): Promise<LocaleSnapshot> {
    const { locale, source } = this.startupSelection();

    if (locale.tag === FALLBACK_LOCALE) {
      return this.commitBundledEnglish(source);
    }

    this.setLoading(true);
    return this.commitCandidate(await this.#loader.load(locale), source);
  }

  /**
   * The locale startup would choose, and why.
   *
   * Each browser tag is tried as an exact match and then as its base language
   * before the next tag is considered, so `['de-AT', 'en']` selects German
   * rather than English: the Commander's own order of preference is respected
   * rather than reordered by how precisely each entry happens to be written.
   */
  startupSelection(): { locale: ShippedLocale; source: LocaleSelectionSource } {
    for (const tag of this.#navigator.languages()) {
      const locale = resolveShippedLocale(tag);
      if (locale) {
        return { locale, source: 'browser' };
      }
    }

    return { locale: fallbackLocale(), source: 'default' };
  }

  /**
   * The single commit point.
   *
   * One revision increment, one snapshot write and one root-document write per
   * committed locale state. Nothing else in the application writes root `lang`
   * or `dir`.
   */
  #commit(next: Omit<LocaleSnapshot, 'revision'>): LocaleSnapshot {
    const snapshot: LocaleSnapshot = { ...next, revision: this.#snapshot().revision + 1 };
    this.#snapshot.set(snapshot);
    this.#loading.set(false);
    // Messages, effective locale, direction and title in one write. The
    // formatters read their locale from this same snapshot, so they change with
    // it rather than one render later.
    this.#document.commitRootState(
      snapshot.effectiveLocale,
      snapshot.direction,
      this.#title(snapshot.catalogue),
    );
    return snapshot;
  }

  #title(catalogue: MessageCatalogue): string {
    return resolveDocumentTitle(
      catalogue,
      (pattern, params) => {
        const transpiled: unknown = this.#transpiler.transpile({
          value: pattern,
          params,
          translation: catalogue,
          key: 'app.document-title',
        });
        return typeof transpiled === 'string' ? transpiled : pattern;
      },
      this.#page(),
    );
  }
}

/**
 * The state the store holds before anything is committed.
 *
 * It is a complete, readable bundled-English snapshot rather than an empty or
 * loading placeholder, which is what guarantees no raw message key can ever be
 * rendered — there is no moment at which the catalogue is absent. Its revision
 * is `0`: no commit has happened yet, so nothing has been published.
 */
function bootstrapSnapshot(): LocaleSnapshot {
  return {
    revision: 0,
    requestedLocale: FALLBACK_LOCALE,
    effectiveLocale: FALLBACK_LOCALE,
    selectionSource: 'default',
    catalogue: BUNDLED_ENGLISH,
    direction: 'ltr',
    status: 'ready',
    fallbackReason: null,
  };
}
