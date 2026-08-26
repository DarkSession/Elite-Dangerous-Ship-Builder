import { Injectable, computed, inject } from '@angular/core';
import { resolveDocumentTitle } from './document-title';
import { LocaleStore } from './locale.store';
import { interpolate, type MessageKey } from './locale-registry';

/**
 * Interpolation parameters for a message.
 *
 * Values are language-neutral: a caller passes a number, not a formatted one,
 * and a formatted value only after the formatter registry has produced it for
 * the active locale. Nothing here may be a preformatted `en-US` string.
 */
export type MessageParams = Readonly<Record<string, string | number>>;

/**
 * The application's only source of owned display text.
 *
 * Every application-owned string a Commander can read resolves through here
 * (FR-016). Game nouns, descriptions and package diagnostics do not: they come
 * from Almanac leaf helpers and never from these catalogues (FR-020).
 *
 * The active catalogue is whatever the store has committed, so a message
 * resolved during a locale switch is either entirely the old language or
 * entirely the new one — never a mix.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  readonly #store = inject(LocaleStore);

  /** The active catalogue, as a signal, so templates recompute on commit. */
  readonly catalogue = this.#store.catalogue;

  /** The locale the resolved text is actually in. */
  readonly locale = this.#store.effectiveLocale;

  /** The direction the resolved text reads in. */
  readonly direction = this.#store.direction;

  /**
   * Resolves an application message for the active locale.
   *
   * An unknown key is an application defect, not a Commander's problem: it
   * resolves to the catalogue's generic unavailable message and never echoes
   * the key, a blank string or a placeholder (localization contract, "Message
   * resolution").
   */
  message(key: MessageKey, params?: MessageParams): string {
    const catalogue = this.#store.catalogue();
    const value = catalogue[key];

    if (typeof value !== 'string' || value.length === 0) {
      return catalogue['message.unavailable'];
    }

    if (params === undefined) {
      return value;
    }

    return interpolate(value, params);
  }

  /**
   * The document title for a page, in the active locale.
   *
   * The store writes the title as part of the locale commit so it can never
   * disagree with the root `lang`; this exposes the same resolved string to
   * anything that needs to display or assert it, through the same rule.
   */
  documentTitle(page: string | null = null): string {
    return resolveDocumentTitle(this.#store.catalogue(), page);
  }

  /**
   * A message as a computed signal.
   *
   * Prefer this in a component so the text re-resolves when a locale commits,
   * rather than being read once at construction.
   */
  messageSignal(key: MessageKey, params?: MessageParams) {
    return computed(() => this.message(key, params));
  }
}
