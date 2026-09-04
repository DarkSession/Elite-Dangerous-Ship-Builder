/**
 * Every address this application publishes, and what its document says.
 *
 * One reader, three consumers: `scripts/generate-sitemap.mjs` writes the map a
 * crawler follows, `scripts/publish-static-routes.mjs` writes the document each
 * address answers with, and `searchMetadataViolations` in
 * `scripts/check-interface-foundations.mjs` reconciles both against the route
 * table. The address list is stated here and nowhere else, and `readSitemap`
 * below is the single way the generated map is read back, so no two consumers
 * can disagree about which addresses this application publishes
 * (`design/search-visibility.md`).
 *
 * **The hulls come from the package.** `SHIPS` is the Almanac's own catalogue,
 * so the address list tracks a pin move by being regenerated rather than by
 * being remembered, and no hull symbol or hull name is written down here
 * (constitution II, and constitution VI for the name).
 *
 * **A hull is addressed by its name, made URL-ready.** `hullAddressSegment`
 * below spells it, and `src/app/domain/ships/catalogue/hull-address.ts` spells the
 * same rule for the running application. That is a second statement of one
 * fact, and it is deliberate for the reason the interpolation and title copies
 * below exist: this is `.mjs` and cannot import the TypeScript that defines it.
 * `hullAddressParity` in `src/app/domain/ships/catalogue/hull-address.spec.ts` holds
 * the two to the same answer for every hull the package carries, so the copy
 * cannot drift in silence (001/FR-005).
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
export const HULL_ROUTE = `${HULL_PARENT}/:hull`;

/**
 * The address segment one hull answers to: its name with each space underscored.
 *
 * The package's names carry only letters, digits, spaces and hyphens, so every
 * one of them spells an address without being escaped.
 */
export function hullAddressSegment(name) {
  return name.replace(/ /g, '_');
}

/** The card a link preview shows for anything that is not one hull. */
export const SITE_CARD = 'assets/link-card.png';

/**
 * The addresses that exist whatever the package contains.
 *
 * `path` is the route table's own path, and the two message keys are the ones
 * that route declares. `'**'` is absent because a wildcard is not an address
 * (the checker's `UNLISTABLE_ROUTES` agrees).
 *
 * `''` is here, and used not to be. It was a redirect into the ship tool, and a
 * redirect is not an address; it is the start page now, and it is the one
 * address that describes the product rather than one of its tools — which is
 * the address a search for NavBeacon should return.
 */
export const STATIC_ADDRESSES = [
  { path: '', titleKey: 'app.name', descriptionKey: 'app.description' },
  { path: 'ships', titleKey: 'catalogue.title', descriptionKey: 'catalogue.description' },
  { path: 'outfitting', titleKey: 'workspace.title', descriptionKey: 'workspace.description' },
  { path: 'equipment', titleKey: 'equipment.title', descriptionKey: 'equipment.description' },
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
  // The root's own name is the product's name. Stated once, as
  // `resolveDocumentTitle` states it.
  if (page.trim() === catalogue['app.name']) {
    return application;
  }
  return interpolate(catalogue['app.document-title'], { page, app: catalogue['app.name'] });
}

/**
 * Every published address, in the order the sitemap lists them.
 *
 * Hulls are sorted by address rather than left in the package's own order, so a
 * pin move that reorders the catalogue does not rewrite the whole file and hide
 * the one hull it actually added.
 */
export function publishedAddresses({ origin, ships = SHIPS } = {}) {
  if (typeof origin !== 'string' || origin.length === 0) {
    throw new Error('publishedAddresses needs the origin the addresses are under.');
  }

  const hulls = [...ships]
    // By code unit rather than by collation. This order is the byte order of a
    // committed file that CI compares exactly, and ICU collation varies with
    // how Node was built — a small-icu runner would reorder the map and fail
    // the comparison with a message about the package.
    //
    // Sorted by the address rather than by the symbol, so the map reads in the
    // order it is written in and a hull added by a pin move lands beside the
    // ones it is named like.
    .sort((one, other) => {
      const first = hullAddressSegment(one.name);
      const second = hullAddressSegment(other.name);
      return first < second ? -1 : first > second ? 1 : 0;
    })
    .map((ship) => ({
      path: `${HULL_PARENT}/${hullAddressSegment(ship.name)}`,
      route: HULL_ROUTE,
      ...HULL_KEYS,
      params: { hull: ship.name },
      // The illustration is still filed under the symbol: the address changed
      // and the identity did not (001/FR-001, FR-005).
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

/**
 * What a document says outside its XML comments, so nothing inside one is read.
 *
 * The body is "anything but `--`" rather than a lazy `[\s\S]*?`, because XML
 * forbids `--` inside a comment and this does not validate the file: the lazy
 * form would quietly close a malformed comment early and expose a `<loc>`
 * nobody meant to publish. This form closes nothing early and leaves the
 * delimiters of a malformed comment standing, which is what `readSitemap`
 * refuses on.
 *
 * **This is not a sanitiser and nothing may treat it as one.** One pass leaves
 * some documents holding a delimiter still — a nested `<!<!-- -->--`
 * reassembles one — and looping until none is left would be unpredictable from
 * the input. The leftovers are what the caller acts on.
 *
 * Written as "keep what lies between the comments" rather than as a replace,
 * because removing a multi-character delimiter from a string reads as an
 * attempt to make that string safe, which this is not. Same regular expression
 * and the same single left-to-right pass over non-overlapping matches, so the
 * result is identical; the difference is only in what the code claims to be.
 */
export function withoutXmlComments(document) {
  const kept = [];
  let cut = 0;

  for (const comment of document.matchAll(/<!--(?:[^-]|-[^-])*-->/g)) {
    kept.push(document.slice(cut, comment.index));
    cut = comment.index + comment[0].length;
  }
  kept.push(document.slice(cut));

  return kept.join('');
}

/**
 * The addresses a sitemap advertises, and the reason it cannot be read.
 *
 * The one reader of the generated map, shared by the publisher and by the
 * policy checker so the two cannot read one file differently: an address they
 * disagree about is either a `<loc>` that passes the gate and never gets a
 * file, or a file published from inside a comment. They react differently — the
 * publisher refuses, the checker fails by name — so the defect is returned
 * rather than thrown, and each consumer says it in its own words.
 *
 * `--!>` is refused alongside `-->` because it ends a comment in HTML and ends
 * nothing in XML: a map holding one is malformed either way, and refusing it
 * can only turn a file nobody can read into a named failure.
 */
export function readSitemap(document) {
  const body = withoutXmlComments(document);
  if (/<!--|--!?>/.test(body)) {
    return {
      addresses: [],
      defect:
        'A comment here is nested or contains "--", so the file does not say what it appears to.',
    };
  }

  const addresses = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]);
  if (addresses.length === 0) {
    return { addresses, defect: 'No <loc> is listed, so the map advertises nothing.' };
  }
  return { addresses, defect: null };
}
