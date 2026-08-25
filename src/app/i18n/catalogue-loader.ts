import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/core';
import {
  BUNDLED_ENGLISH,
  FALLBACK_LOCALE,
  MESSAGE_KEYS,
  type LocaleCandidate,
  type MessageCatalogue,
  type ShippedLocale,
} from './locale-registry';

/**
 * Loads and validates a shipped catalogue before anything can publish it.
 *
 * A catalogue is either complete or it is not used. There is no partial
 * publication and no per-key fallback at runtime: a German catalogue missing
 * three keys would render three English words inside German prose, under a
 * German root `lang`, which is worse than showing complete English and saying
 * so (FR-019).
 *
 * Every failure resolves to a stable code. No fetch exception, parser message
 * or URL becomes display text — a Commander is told the language could not be
 * loaded, not what the parser thought of byte 412.
 */

/** Why a candidate catalogue was rejected. Diagnostic detail, never displayed. */
export interface CatalogueProblem {
  readonly kind: 'missing-key' | 'unknown-key' | 'blank-value' | 'wrong-type' | 'interpolation';
  readonly key: string;
  readonly detail: string;
}

/** The result of validating a parsed candidate. */
export interface CatalogueValidation {
  /** The validated catalogue, or `null` when anything at all was wrong. */
  readonly catalogue: MessageCatalogue | null;
  readonly problems: readonly CatalogueProblem[];
}

/** The interpolation variables a message pattern declares, in a stable order. */
export function interpolationVariables(pattern: string): readonly string[] {
  const found = new Set<string>();
  for (const match of pattern.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    const name = match[1];
    if (name !== undefined) {
      found.add(name);
    }
  }
  return [...found].sort();
}

/**
 * Validates a parsed candidate against the bundled English schema.
 *
 * English is the schema: it defines the key set and the interpolation variables
 * every shipped locale carries. Reporting every problem rather than the first
 * means one failed load names everything a translator has to fix, instead of
 * one thing per attempt.
 */
export function validateCatalogue(value: unknown): CatalogueValidation {
  const problems: CatalogueProblem[] = [];

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      catalogue: null,
      problems: [{ kind: 'wrong-type', key: '', detail: 'The catalogue is not a JSON object.' }],
    };
  }

  const candidate = value as Record<string, unknown>;

  for (const key of Object.keys(candidate)) {
    if (!(key in BUNDLED_ENGLISH)) {
      problems.push({
        kind: 'unknown-key',
        key,
        detail: 'The key does not exist in the bundled English catalogue.',
      });
    }
  }

  for (const key of MESSAGE_KEYS) {
    const message = candidate[key];

    if (message === undefined) {
      problems.push({ kind: 'missing-key', key, detail: 'The key is absent.' });
      continue;
    }
    if (typeof message !== 'string') {
      problems.push({ kind: 'wrong-type', key, detail: 'The value is not a string.' });
      continue;
    }
    if (message.trim().length === 0) {
      problems.push({ kind: 'blank-value', key, detail: 'The value is blank.' });
      continue;
    }

    const expected = interpolationVariables(BUNDLED_ENGLISH[key]);
    const actual = interpolationVariables(message);
    if (expected.join('|') !== actual.join('|')) {
      problems.push({
        kind: 'interpolation',
        key,
        detail: `Expected variables [${expected.join(', ')}] but found [${actual.join(', ')}].`,
      });
    }
  }

  if (problems.length > 0) {
    return { catalogue: null, problems };
  }

  return { catalogue: candidate as MessageCatalogue, problems: [] };
}

@Injectable({ providedIn: 'root' })
export class CatalogueLoader {
  readonly #window = inject(DOCUMENT).defaultView;

  /**
   * Loads one shipped locale's catalogue.
   *
   * English needs no request: it is imported into the initial bundle, which is
   * what makes complete fallback text available with no network at all. Every
   * other locale is a same-origin static asset under the deployment's own
   * `i18n/` directory — nothing here ever reaches another origin
   * (constitution I). The path is base-relative, so `fetch` resolves it
   * against the document's base URL and a build served from a sub-path finds
   * its catalogues where that build actually put them.
   */
  async load(locale: ShippedLocale): Promise<LocaleCandidate> {
    if (locale.tag === FALLBACK_LOCALE) {
      return {
        requested: locale.tag,
        catalogue: BUNDLED_ENGLISH,
        source: 'bundle',
        failure: null,
      };
    }

    let parsed: unknown;
    try {
      const response = await this.#fetch(locale.assetPath);
      if (!response.ok) {
        return this.#failed(locale, 'load-failed');
      }
      parsed = await response.json();
    } catch {
      // A network failure, an aborted request, or a body that is not JSON. All
      // of them mean the same thing to a Commander, and none of their messages
      // is safe to show.
      return this.#failed(locale, 'load-failed');
    }

    const { catalogue } = validateCatalogue(parsed);
    if (catalogue === null) {
      return this.#failed(locale, 'invalid-catalogue');
    }

    return { requested: locale.tag, catalogue, source: 'asset', failure: null };
  }

  #failed(locale: ShippedLocale, failure: 'load-failed' | 'invalid-catalogue'): LocaleCandidate {
    return { requested: locale.tag, catalogue: null, source: 'asset', failure };
  }

  async #fetch(path: string): Promise<Response> {
    const fetcher = this.#window?.fetch;
    if (!fetcher) {
      throw new Error('This runtime has no fetch implementation.');
    }
    return fetcher.call(this.#window, path, { credentials: 'omit' });
  }
}
