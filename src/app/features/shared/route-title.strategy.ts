import { Injectable, inject } from '@angular/core';
import {
  TitleStrategy,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { LocaleStore } from '../../i18n/locale.store';
import { MessageService } from '../../i18n/message.service';
import { MESSAGE_KEYS, type MessageKey } from '../../i18n/locale-registry';

/**
 * Resolves a route's message keys into what the document says it is.
 *
 * Routes declare keys, not phrases, so the title and the description a search
 * result quotes are translated by the same catalogue as everything else and are
 * republished by the locale store in the same commit as the root `lang` — a
 * title in one language under a root `lang` in another is exactly what that
 * single commit exists to prevent (011/FR-027).
 *
 * A route with no title, or with a key this build does not carry, leaves the
 * product name standing rather than writing a raw key into the tab. The same is
 * true of the description: an absent one falls back to the application's own
 * rather than being published blank.
 *
 * Angular's title strategy is the only hook that fires on every completed
 * navigation and carries the router state, which is why the canonical address
 * is taken here rather than from a second subscription that could run in the
 * other order.
 */
@Injectable()
export class RouteTitleStrategy extends TitleStrategy {
  readonly #locale = inject(LocaleStore);
  readonly #messages = inject(MessageService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.#locale.setRoute({
      title: this.#resolve(this.buildTitle(snapshot)),
      description: this.#resolve(nearestDescription(snapshot.root)),
      path: snapshot.url,
    });
  }

  /** A message key becomes text; anything else becomes nothing at all. */
  #resolve(key: string | undefined): string | null {
    return key !== undefined && isMessageKey(key) ? this.#messages.message(key) : null;
  }
}

/**
 * The description of the deepest route that declares one.
 *
 * Walked rather than read off the leaf, because a child route need not repeat
 * what its parent already says: an open hull sits inside the catalogue screen
 * and is that screen's subject, so it inherits that screen's description unless
 * it states its own. Angular inherits `data` down a route tree only when the
 * router is configured to, and configuring it globally would change what every
 * other consumer of `data` sees.
 */
function nearestDescription(root: ActivatedRouteSnapshot): string | undefined {
  let found: string | undefined;
  for (let route: ActivatedRouteSnapshot | null = root; route; route = route.firstChild) {
    const declared: unknown = route.data['description'];
    if (typeof declared === 'string') {
      found = declared;
    }
  }
  return found;
}

function isMessageKey(value: string): value is MessageKey {
  return (MESSAGE_KEYS as readonly string[]).includes(value);
}
