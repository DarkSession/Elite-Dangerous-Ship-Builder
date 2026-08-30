/**
 * Every address this application publishes, and what its document says.
 *
 * One reader, three consumers: `scripts/generate-sitemap.mjs` writes the map a
 * crawler follows, `scripts/publish-static-routes.mjs` writes the document each
 * address answers with, and `searchMetadataViolations` in
 * `scripts/check-interface-foundations.mjs` reconciles both against the route
 * table. Before this module the route list existed twice — in `app.routes.ts`
 * and in a hand-written sitemap — and the deployment read the second one with
 * `sed` while the checker read it with a regular expression. Two readers of one
 * file, in two languages, was a drift the first pass could only manage; one
 * module is the fix rather than the management (`design/search-visibility.md`).
 *
 * **The hulls come from the package.** `SHIPS` is the Almanac's own catalogue,
 * so the address list tracks a pin move by being regenerated rather than by
 * being remembered, and no hull symbol or hull name is written down here
 * (constitution II, and constitution VI for the name).
 *
 * **The message keys are stated here as well as in `app.routes.ts`.** That is a
 * second statement of one fact, and it is deliberate: the alternative is a
 * script that parses TypeScript, which stops working the first time the file is
 * formatted differently and says nothing when it does. The checker reconciles
 * the two, so a route added without a key, a key renamed under a map nobody
 * reopened, or an address the route table does not serve, each fail the build by
 * name.
 */
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';

/** The route the hull addresses sit under, as `app.routes.ts` spells it. */
export const HULL_PARENT = 'ships';

/** The route path of the hull screen, as the route table declares it. */
export const HULL_ROUTE = `${HULL_PARENT}/:symbol`;

/** The card a link preview shows for anything that is not one hull. */
export const SITE_CARD = 'assets/link-card.png';

/**
 * The addresses that exist whatever the package contains.
 *
 * `path` is the route table's own path, and the two message keys are the ones
 * that route declares. `''` and `'**'` are absent because a redirect and a
 * wildcard are not addresses (the checker's `UNLISTABLE_ROUTES` agrees).
 */
export const STATIC_ADDRESSES = [
  { path: 'ships', titleKey: 'catalogue.title', descriptionKey: 'catalogue.description' },
  { path: 'build', titleKey: 'workspace.title', descriptionKey: 'workspace.description' },
  { path: 'builds', titleKey: 'library.title', descriptionKey: 'library.description' },
];

/** The message keys the hull address resolves, with the hull interpolated in. */
export const HULL_KEYS = {
  titleKey: 'hullDetail.title',
  descriptionKey: 'hullDetail.description',
};

/** One hull's own illustration, which is the card its address shows. */
export function hullCard(symbol) {
  return `assets/ships/${symbol}/illustration.png`;
}

/**
 * The placeholder form, spelled as `locale-registry.ts` spells it.
 *
 * A third copy, for the reason the checker's own copy exists: this is `.mjs`
 * and cannot import the TypeScript that defines it. Two spellings would be a
 * head the deployment writes one way and the running application writes
 * another, which is exactly the drift a static head is published to avoid.
 */
const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;

/** Substitutes `{{ name }}` placeholders, as `interpolate` does at runtime. */
export function interpolate(pattern, params) {
  return pattern.replace(PLACEHOLDER, (_, name) =>
    Object.hasOwn(params, name) && params[name] != null ? String(params[name]) : '',
  );
}

/**
 * The document title, composed as `resolveDocumentTitle` composes it.
 *
 * The fourth copy of a runtime rule, and the one most worth stating why. A
 * published document's title has to be the string the bundle will write over it
 * a moment later; a crawler that reads the file and a Commander who watches the
 * tab must not be told two different names for one page. `documentTitleParity`
 * in `src/app/i18n/document-title.spec.ts` holds this function and that one to
 * the same answer for every published address, so the copy cannot drift in
 * silence.
 */
export function documentTitle(catalogue, page) {
  const application = catalogue['app.document-title.default'];

  if (page === null || page.trim().length === 0) {
    return application;
  }
  if (namesTheApplication(page, catalogue['app.name'])) {
    return application;
  }
  return interpolate(catalogue['app.document-title'], { page, app: catalogue['app.name'] });
}

/** Whether the application name already says what this page is called. */
function namesTheApplication(page, application) {
  const name = page.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const edge = '[^\\p{L}\\p{N}]';
  return new RegExp(`(^|${edge})${name}($|${edge})`, 'iu').test(application);
}

/**
 * Every published address, in the order the sitemap lists them.
 *
 * Hulls are sorted by symbol rather than left in the package's own order, so a
 * pin move that reorders the catalogue does not rewrite the whole file and hide
 * the one hull it actually added.
 */
export function publishedAddresses({ origin, ships = SHIPS } = {}) {
  if (typeof origin !== 'string' || origin.length === 0) {
    throw new Error('publishedAddresses needs the origin the addresses are under.');
  }

  const hulls = [...ships]
    .sort((one, other) => one.symbol.localeCompare(other.symbol, 'en'))
    .map((ship) => ({
      path: `${HULL_PARENT}/${ship.symbol}`,
      route: HULL_ROUTE,
      ...HULL_KEYS,
      params: { hull: ship.name },
      image: hullCard(ship.symbol),
    }));

  return [
    ...STATIC_ADDRESSES.map((entry) => ({
      ...entry,
      route: entry.path,
      params: {},
      image: SITE_CARD,
    })),
    ...hulls,
  ].map((entry) => ({ ...entry, address: `${origin}/${entry.path}` }));
}

/**
 * What one address's document says, resolved in a catalogue.
 *
 * The alt text is the title rather than a message of its own. The card is the
 * mark on the application's ground, or a hull's illustration; either way the
 * true description of the picture is the name of the page it belongs to, and a
 * separate string would be one more thing to translate and to keep true.
 */
export function documentHead(entry, catalogue, origin) {
  const page = interpolate(catalogue[entry.titleKey], entry.params);
  const title = documentTitle(catalogue, page);
  return {
    title,
    description: interpolate(catalogue[entry.descriptionKey], entry.params),
    canonical: entry.address,
    image: `${origin}/${entry.image}`,
    imageAlt: title,
  };
}

/**
 * The production origin, read from the one file that declares it.
 *
 * Read rather than passed in, because every consumer here would otherwise be a
 * place the origin could be stated differently — which is the fault
 * `site-address.ts` exists to prevent.
 */
export function declaredOrigin(source) {
  const declared = /SITE_ORIGIN\s*=\s*'(https:\/\/[^']+)'/.exec(source);
  if (declared === null) {
    throw new Error(
      'No SITE_ORIGIN is declared, so nothing states where this application is published.',
    );
  }
  return declared[1];
}
