import { Injectable, computed, inject } from '@angular/core';
import { LocaleStore } from './locale.store';
import { interpolate, type MessageKey, type MessageParams } from './locale-registry';

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
  message(key: MessageKey, params: MessageParams = {}): string {
    const catalogue = this.#store.catalogue();
    const value = catalogue[key];

    if (typeof value !== 'string' || value.length === 0) {
      return catalogue['message.unavailable'];
    }

    // Interpolated even with no parameters. A caller that forgets them is an
    // application defect, and the Commander's half of it must not be a screen
    // reading `{{count}}` (localization contract, "Message resolution").
    return interpolate(value, params);
  }

  /**
   * A message as a computed signal.
   *
   * Prefer this in a component so the text re-resolves when a locale commits,
   * rather than being read once at construction.
   */
  messageSignal(key: MessageKey, params: MessageParams = {}) {
    return computed(() => this.message(key, params));
  }
}
