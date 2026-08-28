import { Injectable, computed, inject, signal } from '@angular/core';
import { DocumentAdapter } from '../platform/browser/document.adapter';
import { NavigatorAdapter } from '../platform/browser/navigator.adapter';
import { canonicalAddress } from '../platform/browser/site-address';
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
  type MessageKey,
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

  readonly #snapshot = signal<LocaleSnapshot>(bootstrapSnapshot());

  /** True only while a candidate is being loaded. The prior snapshot stays visible. */
  readonly #loading = signal(false);

  /**
   * The message key the route contributes to the document title.
   *
   * A key rather than the sentence it resolves to. The route is chosen once and
   * the language can change under it — a catalogue arriving after the first
   * navigation is the ordinary case, because selecting a non-English locale
   * takes a request and the first navigation does not. Storing the text would
   * freeze the page name in whichever language happened to be committed when
   * the route was entered, and leave it there under a root `lang` that has
   * since moved (FR-019).
   */
  readonly #titleKey = signal<MessageKey | null>(null);

  /**
   * The message key the route contributes to the search metadata.
   *
   * `null` where the route declares none, which falls back to the
   * application's own description rather than leaving the tag blank.
   */
  readonly #descriptionKey = signal<MessageKey | null>(null);

  /** The route's own path, which becomes its canonical address. */
  readonly #path = signal('/');

  /** The current committed locale state. Always complete, always usable. */
  readonly snapshot = this.#snapshot.asReadonly();

  /** True while a secondary catalogue is in flight. */
  readonly loading = this.#loading.asReadonly();

  /** The page name currently contributing to the document title. */
  readonly page = computed(() => this.#pageName(this.#snapshot().catalogue));

  /** The canonical address of the route currently on screen. */
  readonly canonical = computed(() => canonicalAddress(this.#path()));

  /**
   * What the document currently says this page is, in the committed language.
   *
   * Public because it is what a search result quotes and a link preview shows,
   * which makes it as much a published fact about the interface as the title
   * is — and the only way to assert the route and the language agree on it.
   */
  readonly description = computed(() => this.#pageDescription(this.#snapshot().catalogue));

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
   * Sets what the route contributes to the document, and republishes it.
   *
   * The route owns its own identity — which page it is, what that page is for,
   * and where it lives; the store owns how those are worded, in which language,
   * and how the page name is combined with the application name.
   *
   * One method rather than three, because all three are written in one commit
   * and a route that could set two of them would eventually set two of them:
   * a title from one screen under a canonical from the last is precisely the
   * mismatch the single commit exists to make impossible (011/FR-027).
   */
  setRoute(route: RouteIdentity): void {
    this.#titleKey.set(route.titleKey);
    this.#descriptionKey.set(route.descriptionKey);
    this.#path.set(route.path);
    this.#publish(this.#snapshot());
  }

  /**
   * What the route is contributing right now, as it was committed.
   *
   * For the one surface that stands over a screen without navigating: the
   * saved-build layer takes the document's identity while it is up and has to
   * give back exactly what it took, and re-deriving it from the router would be
   * a second answer to a question this store already holds (011/FR-027).
   */
  route(): RouteIdentity {
    return {
      titleKey: this.#titleKey(),
      descriptionKey: this.#descriptionKey(),
      path: this.#path(),
    };
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
   * committed locale state.
   *
   * Not the only caller of {@link #publish}: `setRoute` publishes too, on the
   * snapshot already committed, because the route changes what the document
   * says without changing which language says it. Both go through the one
   * adapter, and nothing outside this store writes root `lang` or `dir`.
   */
  #commit(next: Omit<LocaleSnapshot, 'revision'>): LocaleSnapshot {
    const snapshot: LocaleSnapshot = { ...next, revision: this.#snapshot().revision + 1 };
    this.#snapshot.set(snapshot);
    this.#loading.set(false);
    this.#publish(snapshot);
    return snapshot;
  }

  /**
   * The one write of root document state.
   *
   * Messages, effective locale, direction, title, description and canonical in
   * one call. The formatters read their locale from the same snapshot, so they
   * change with it rather than one render later, and the description can never
   * be left in the language the title has just moved out of.
   */
  #publish(snapshot: LocaleSnapshot): void {
    this.#document.commitRootState({
      language: snapshot.effectiveLocale,
      direction: snapshot.direction,
      title: this.#title(snapshot.catalogue),
      description: this.#pageDescription(snapshot.catalogue),
      canonical: this.canonical(),
    });
  }

  #title(catalogue: MessageCatalogue): string {
    return resolveDocumentTitle(catalogue, this.#pageName(catalogue));
  }

  /** The route's page name, resolved in the catalogue being published. */
  #pageName(catalogue: MessageCatalogue): string | null {
    const key = this.#titleKey();
    return key === null ? null : catalogue[key];
  }

  /**
   * What this page is, in the committed language.
   *
   * A route with nothing of its own to say falls back to the application's
   * description rather than to a blank tag: a page that declares it has nothing
   * to say is read by a search engine as exactly that.
   */
  #pageDescription(catalogue: MessageCatalogue): string {
    return catalogue[this.#descriptionKey() ?? 'app.description'];
  }
}

/**
 * What a route contributes to the document.
 *
 * Keys rather than the sentences they resolve to, and the store resolves them
 * on every commit. That is the whole of what makes the title and the
 * description move with the language rather than with the navigation: a session
 * whose German catalogue lands after its first navigation — which is the
 * ordinary order, since the catalogue takes a request and the navigation does
 * not — retranslates both on the commit that publishes it.
 *
 * Either key may be `null` where the route declares none. A key naming a
 * message this build does not carry never reaches here: `RouteTitleStrategy`
 * turns it into `null` rather than into a raw key on screen.
 */
export interface RouteIdentity {
  readonly titleKey: MessageKey | null;
  readonly descriptionKey: MessageKey | null;
  /** The router's own URL for this route, query and fragment included or not. */
  readonly path: string;
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
