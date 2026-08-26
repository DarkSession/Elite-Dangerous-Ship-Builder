import englishCatalogue from './locales/en.json';

/**
 * The English catalogue defines the typed key schema for the whole application.
 * Every shipped locale carries exactly these keys (FR-019), which is enforced at
 * build time by the repository policy checker, so one type describes them all.
 */
export type MessageKey = keyof typeof englishCatalogue;

/** An immutable, complete set of application-owned messages. */
export type MessageCatalogue = Readonly<Record<MessageKey, string>>;

/** The bundled English catalogue. Readable with no network, always. */
export const BUNDLED_ENGLISH: MessageCatalogue = englishCatalogue;

/** Every application message key, for validation and tests. */
export const MESSAGE_KEYS = Object.keys(englishCatalogue) as readonly MessageKey[];

/** A language this build can actually display. */
export interface ShippedLocale {
  /** Canonical BCP 47 tag and unique production identity. */
  readonly tag: string;
  /** Base language, consulted only after exact tag matching fails. */
  readonly language: string;
  /** Writing direction, published together with the catalogue. */
  readonly direction: 'ltr' | 'rtl';
  /**
   * Same-origin catalogue path, relative to the deployment base.
   *
   * Relative rather than root-absolute, for the same reason `hullArtworkPath`
   * is: a preview is served from a sub-path of a Pages site, and a leading
   * slash would look for every catalogue at the host root. `fetch` resolves a
   * relative path against the document's base URL, so `<base href>` alone
   * decides where these are read from and no caller has to join anything.
   * It is also the stricter same-origin guarantee (FR-019): a root-absolute
   * path still admits a protocol-relative `//host/...`, and this does not.
   * English is additionally bundled and never requested at all.
   */
  readonly assetPath: string;
  /** Exactly one shipped locale is the fallback. */
  readonly fallback: boolean;
}

/** How the active locale came to be chosen. */
export type LocaleSelectionSource = 'browser' | 'default';

/** Where a candidate catalogue came from. Diagnostic and test provenance only. */
export type LocaleCandidateSource = 'bundle' | 'asset' | 'cache';

/**
 * Why a requested locale could not be used. Stable codes, never display text —
 * a fetch exception, parser message or URL must not reach a Commander.
 */
export type LocaleFailureCode = 'load-failed' | 'invalid-catalogue' | 'unknown-locale';

/** A locale being loaded. It cannot partially update anything. */
export interface LocaleCandidate {
  readonly requested: string;
  readonly catalogue: MessageCatalogue | null;
  readonly source: LocaleCandidateSource;
  readonly failure: LocaleFailureCode | null;
}

/**
 * One committed, complete locale state.
 *
 * Every field is published together in a single revision, so no frame can mix
 * languages or show a translated label under the wrong root `lang`.
 */
export interface LocaleSnapshot {
  /** Increments once per committed startup, switch or fallback. */
  readonly revision: number;
  readonly requestedLocale: string;
  readonly effectiveLocale: string;
  readonly selectionSource: LocaleSelectionSource;
  readonly catalogue: MessageCatalogue;
  readonly direction: 'ltr' | 'rtl';
  /** Both states are readable and usable. */
  readonly status: 'ready' | 'fallback';
  /** Present only when the requested locale could not be used. */
  readonly fallbackReason: LocaleFailureCode | null;
}

/** The fallback locale's tag. English is the only fallback (FR-017). */
export const FALLBACK_LOCALE = 'en';

/**
 * The production locale registry.
 *
 * Test-only expanded-copy and right-to-left providers are deliberately absent:
 * they are not shipped locales, cannot be selected and cannot be persisted
 * (localization contract, "Production locale registry").
 */
export const SHIPPED_LOCALES: readonly ShippedLocale[] = [
  {
    tag: 'en',
    language: 'en',
    direction: 'ltr',
    assetPath: 'i18n/en.json',
    fallback: true,
  },
  {
    tag: 'de',
    language: 'de',
    direction: 'ltr',
    assetPath: 'i18n/de.json',
    fallback: false,
  },
];

/**
 * Normalises a tag for comparison.
 *
 * `Intl.getCanonicalLocales` is the authority where the runtime supports the
 * tag; a tag it rejects falls back to a lowercase comparison rather than
 * throwing, because a malformed browser entry must not break startup.
 */
function canonicalizeTag(tag: string): string {
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? tag;
  } catch {
    return tag.trim();
  }
}

/** The base language of a tag: `de-DE` becomes `de`. */
function baseLanguage(tag: string): string {
  return canonicalizeTag(tag).split('-')[0]?.toLowerCase() ?? '';
}

/** Whether this build ships the given tag, compared canonically. */
export function isShippedLocale(tag: string): boolean {
  return findShippedLocale(tag) !== null;
}

/** The registry entry for an exact canonical tag match, or `null`. */
export function findShippedLocale(tag: string): ShippedLocale | null {
  const canonical = canonicalizeTag(tag).toLowerCase();
  return SHIPPED_LOCALES.find((locale) => locale.tag.toLowerCase() === canonical) ?? null;
}

/**
 * Resolves a requested tag to a shipped locale, preferring an exact match over
 * a base-language match — `de-DE` and `de-AT` both resolve to `de`, and only
 * after no exact entry exists.
 */
export function resolveShippedLocale(tag: string): ShippedLocale | null {
  const exact = findShippedLocale(tag);
  if (exact) {
    return exact;
  }

  const base = baseLanguage(tag);
  if (base.length === 0) {
    return null;
  }
  return SHIPPED_LOCALES.find((locale) => locale.language.toLowerCase() === base) ?? null;
}

/** The fallback registry entry. Guaranteed to exist by the registry's shape. */
export function fallbackLocale(): ShippedLocale {
  const locale = SHIPPED_LOCALES.find((entry) => entry.fallback);
  if (!locale) {
    throw new Error('The locale registry must declare exactly one fallback locale.');
  }
  return locale;
}
