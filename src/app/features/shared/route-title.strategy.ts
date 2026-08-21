import { Injectable, inject } from '@angular/core';
import { TitleStrategy, type RouterStateSnapshot } from '@angular/router';
import { LocaleStore } from '../../i18n/locale.store';
import { MessageService } from '../../i18n/message.service';
import { MESSAGE_KEYS, type MessageKey } from '../../i18n/locale-registry';

/**
 * Resolves a route's message key into a document title in the active locale.
 *
 * Routes declare a key, not a phrase, so the title is translated by the same
 * catalogue as everything else and is republished by the locale store in the
 * same commit as the root `lang` — a title in one language under a root `lang`
 * in another is exactly what that single commit exists to prevent.
 *
 * A route with no title, or with a key this build does not carry, leaves the
 * product name standing rather than writing a raw key into the tab.
 */
@Injectable()
export class RouteTitleStrategy extends TitleStrategy {
  readonly #locale = inject(LocaleStore);
  readonly #messages = inject(MessageService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot);
    if (key === undefined || !isMessageKey(key)) {
      this.#locale.setPage(null);
      return;
    }
    this.#locale.setPage(this.#messages.message(key));
  }
}

function isMessageKey(value: string): value is MessageKey {
  return (MESSAGE_KEYS as readonly string[]).includes(value);
}
