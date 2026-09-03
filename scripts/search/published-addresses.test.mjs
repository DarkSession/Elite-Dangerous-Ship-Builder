import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HULL_PARENT,
  SITE_CARD,
  declaredOrigin,
  documentHead,
  documentTitle,
  hullAddressSegment,
  hullCard,
  interpolate,
  publishedAddresses,
} from './published-addresses.mjs';

/**
 * The module three readers share.
 *
 * What is worth testing here is not that it lists addresses — it is that the
 * strings it composes are the strings the running application composes. A
 * document published with one title and rewritten with another tells a crawler
 * and a Commander two different names for one page, and neither of them would
 * ever see the other.
 */

const ORIGIN = 'https://navbeacon.app';

/** Two hulls is enough to prove the shape and the ordering. */
const SHIPS = [
  { symbol: 'Empire_Trader', name: 'Imperial Clipper' },
  { symbol: 'Anaconda', name: 'Anaconda' },
];

const CATALOGUE = {
  'app.name': 'NavBeacon',
  'app.document-title': '{{page}} · {{app}}',
  'app.document-title.default': 'NavBeacon',
  'catalogue.title': 'Ship Builder',
  'catalogue.description': 'Browse every hull.',
  'hullDetail.title': '{{hull}}',
  'hullDetail.description': '{{hull}}: every figure and the slot layout.',
};

describe('published addresses', () => {
  it('lists the top-level routes and one address per hull', () => {
    const addresses = publishedAddresses({ origin: ORIGIN, ships: SHIPS });

    assert.deepEqual(
      addresses.map((entry) => entry.address),
      [
        `${ORIGIN}/ships`,
        `${ORIGIN}/build`,
        `${ORIGIN}/equipment`,
        `${ORIGIN}/builds`,
        // Addressed by the hull's name with an underscore for each space, and
        // sorted by that address rather than left in the package's order: a pin
        // move that reorders the catalogue then does not rewrite the whole
        // sitemap and hide the one hull it actually added (001/FR-005).
        `${ORIGIN}/${HULL_PARENT}/Anaconda`,
        `${ORIGIN}/${HULL_PARENT}/Imperial_Clipper`,
      ],
    );
  });

  it('spells a name with a space as one address segment', () => {
    assert.equal(hullAddressSegment('Type-11 Prospector'), 'Type-11_Prospector');
    assert.equal(hullAddressSegment('Anaconda'), 'Anaconda');
    assert.equal(hullAddressSegment('Fer-de-Lance'), 'Fer-de-Lance');
  });

  it('gives a hull its own illustration as its card, and everything else the mark', () => {
    const addresses = publishedAddresses({ origin: ORIGIN, ships: SHIPS });

    assert.equal(addresses[0].image, SITE_CARD);
    // The illustration is still filed under the symbol: the address names the
    // hull and the identity does not change with it.
    assert.equal(addresses.at(-1).image, hullCard('Empire_Trader'));
  });

  it('refuses to build addresses without an origin to put them under', () => {
    assert.throws(() => publishedAddresses({ ships: SHIPS }), /origin/);
  });

  it('reads the origin out of the file that declares it, and refuses a file that does not', () => {
    assert.equal(declaredOrigin("export const SITE_ORIGIN = 'https://navbeacon.app';"), ORIGIN);
    assert.throws(() => declaredOrigin('export const NOTHING = 1;'), /SITE_ORIGIN/);
  });
});

describe('what a published document says', () => {
  const hull = () =>
    publishedAddresses({ origin: ORIGIN, ships: SHIPS }).find(
      (entry) => entry.path === `${HULL_PARENT}/Anaconda`,
    );

  it('names the hull in the title and in the description', () => {
    const head = documentHead(hull(), CATALOGUE, ORIGIN);

    assert.equal(head.title, 'Anaconda · NavBeacon');
    assert.equal(head.description, 'Anaconda: every figure and the slot layout.');
  });

  it('carries the card as an address a chat client can fetch, described by the title', () => {
    const head = documentHead(hull(), CATALOGUE, ORIGIN);

    assert.equal(head.image, `${ORIGIN}/assets/ships/Anaconda/illustration.png`);
    assert.equal(head.imageAlt, head.title);
    assert.equal(head.canonical, `${ORIGIN}/${HULL_PARENT}/Anaconda`);
  });

  it('names the screen beside the product on the address the root redirects to', () => {
    // The catalogue screen is the ship builder and the product is NavBeacon, so
    // the address `/` redirects to says which screen it is rather than repeating
    // the product name.
    const catalogue = publishedAddresses({ origin: ORIGIN, ships: SHIPS })[0];

    assert.equal(documentHead(catalogue, CATALOGUE, ORIGIN).title, 'Ship Builder · NavBeacon');
  });

  it('leaves a placeholder with no value as nothing rather than as its own name', () => {
    assert.equal(interpolate('{{hull}} and {{missing}}', { hull: 'Adder' }), 'Adder and ');
  });

  it('falls back to the application title where the page has no name', () => {
    assert.equal(documentTitle(CATALOGUE, null), 'NavBeacon');
    assert.equal(documentTitle(CATALOGUE, '   '), 'NavBeacon');
  });
});
