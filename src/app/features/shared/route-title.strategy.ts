import { Injectable, inject } from '@angular/core';
import {
  TitleStrategy,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import { interpolationVariables } from '../../i18n/catalogue-loader';
import { LocaleStore } from '../../i18n/locale.store';
import {
  BUNDLED_ENGLISH,
  MESSAGE_KEYS,
  type MessageKey,
  type MessageParams,
} from '../../i18n/locale-registry';
import { hullArtworkPath } from '../../platform/assets/hull-artwork-path';

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
 * One route names a subject: a hull address says which hull. Its two keys
 * interpolate `{{hull}}`, this strategy supplies the name, and the hull's own
 * illustration becomes the picture a link preview shows. A key whose variables
 * cannot all be supplied is passed over for the nearest ancestor's, so an
 * address for a symbol the package does not carry publishes the catalogue's
 * identity rather than a sentence with a hole in it.
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
    const hull = resolveHull(snapshot.root);
    const params: MessageParams = hull === null ? {} : { hull: hull.name };

    this.#locale.setRoute({
      titleKey: nearestKey(snapshot.root, (route) => route.title, params),
      descriptionKey: nearestKey(snapshot.root, (route) => route.data['description'], params),
      path: snapshot.url,
      params,
      ...(hull === null ? {} : { image: hullArtworkPath(hull.symbol) }),
    });
  }
}

/** A key this build carries, or nothing at all. */
function messageKey(value: unknown): MessageKey | null {
  return typeof value === 'string' && (MESSAGE_KEYS as readonly string[]).includes(value)
    ? (value as MessageKey)
    : null;
}

/**
 * Whether every variable a key's pattern declares has a value to put in it.
 *
 * English is the schema for the whole catalogue, so the variables are read
 * there and hold for every shipped language — the loader already refuses a
 * translation that drops one or invents one.
 */
function satisfiable(key: MessageKey, params: MessageParams): boolean {
  return interpolationVariables(BUNDLED_ENGLISH[key]).every((name) => Object.hasOwn(params, name));
}

/**
 * The deepest route that declares a key this navigation can actually resolve.
 *
 * Walked rather than read off the leaf, because a child route need not repeat
 * what its parent already says: an open hull sits inside the catalogue screen,
 * and where its own subject cannot be named it is that screen with one thing
 * selected, which is what the catalogue's own description says.
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
function nearestKey(
  root: ActivatedRouteSnapshot,
  declared: (route: ActivatedRouteSnapshot) => unknown,
  params: MessageParams,
): MessageKey | null {
  let found: MessageKey | null = null;
  for (let route: ActivatedRouteSnapshot | null = root; route; route = route.firstChild) {
    const key = messageKey(declared(route));
    if (key !== null && satisfiable(key, params)) {
      found = key;
    }
  }
  return found;
}

/**
 * The hull this navigation is about, where it is about one.
 *
 * The name is the package's, never a table kept here (constitution II and VI).
 * It is the same name in every language on purpose: the Almanac publishes no
 * localised lookup for a hull name because the game does not translate one —
 * the name and the manufacturer are proper nouns, and every source that carries
 * a localised ship column carries the English spelling (`game-text.presenter.ts`,
 * `shipCatalogueText`). So a German document names the hull exactly as a German
 * Commander reads it in the game. The untranslated disclosure that accompanies
 * canonical package text on screen has no expression in a `<title>` or a
 * `<meta>`, and 011/FR-027 names the document head as the one surface where it
 * is not required.
 *
 * Where the symbol resolves to no hull, this is `null` and the address
 * publishes the catalogue's identity. The screen behind it says the same thing
 * in its own way, with the unknown-symbol notice.
 */
function resolveHull(root: ActivatedRouteSnapshot): { symbol: string; name: string } | null {
  for (let route: ActivatedRouteSnapshot | null = root; route; route = route.firstChild) {
    const symbol: unknown = route.params['symbol'];
    if (typeof symbol !== 'string' || symbol.length === 0) {
      continue;
    }
    // The package's own record, so the symbol that reaches the illustration
    // path is the package's spelling of it rather than the URL's: the lookup
    // matches case-insensitively and the artwork directories do not.
    const ship = getShipBySymbol(symbol);
    if (ship != null) {
      return { symbol: ship.symbol, name: ship.name };
    }
  }
  return null;
}
