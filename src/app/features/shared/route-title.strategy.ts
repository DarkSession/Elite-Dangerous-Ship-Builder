import { Injectable, inject } from '@angular/core';
import {
  TitleStrategy,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { LocaleStore } from '../../i18n/locale.store';
import { MESSAGE_KEYS, type MessageKey } from '../../i18n/locale-registry';

/**
 * Hands the locale store what the route says about itself.
 *
 * Message keys, not phrases, and the keys travel unresolved: the store resolves
 * them on every commit, so the document title and the sentence a search result
 * quotes change language with everything else rather than staying in whichever
 * language happened to be committed when the route was entered. That is not a
 * corner case — selecting a non-English catalogue takes a request and the first
 * navigation does not, so the ordinary order is that the language arrives
 * second (011/FR-027, 011/FR-019).
 *
 * A route with no title, or with a key this build does not carry, contributes
 * nothing and leaves the product name standing rather than writing a raw key
 * into the tab. The same is true of the description: an absent one falls back
 * to the application's own rather than being published blank.
 *
 * Angular's title strategy is the only hook that fires on every completed
 * navigation and carries the router state, which is why the canonical address
 * is taken here rather than from a second subscription that could run in the
 * other order.
 */
@Injectable()
export class RouteTitleStrategy extends TitleStrategy {
  readonly #locale = inject(LocaleStore);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.#locale.setRoute({
      titleKey: messageKey(this.buildTitle(snapshot)),
      descriptionKey: messageKey(nearestDescription(snapshot.root)),
      path: snapshot.url,
    });
  }
}

/** A key this build carries, or nothing at all. */
function messageKey(value: string | undefined): MessageKey | null {
  return value !== undefined && (MESSAGE_KEYS as readonly string[]).includes(value)
    ? (value as MessageKey)
    : null;
}

/**
 * The description key of the deepest route that declares one.
 *
 * Walked rather than read off the leaf, because a child route need not repeat
 * what its parent already says: an open hull sits inside the catalogue screen
 * and is that screen's subject, so it inherits that screen's description unless
 * it states its own.
 *
 * Not left to the router's own inheritance either. `paramsInheritanceStrategy`
 * defaults to `emptyOnly`, which passes `data` down to path-less and
 * component-less children only — and every child here loads a component — while
 * setting it to `always` would change what every other consumer of `data` sees
 * for the sake of one key.
 *
 * `firstChild` is `children[0]`, so this follows the primary outlet only for as
 * long as the route table has no named outlet. It has none, and a named one
 * would need this walk to choose the outlet by name rather than by position.
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
