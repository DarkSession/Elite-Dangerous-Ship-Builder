import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { advertisedAddresses, attribute, documentFor, fileFor } from './publish-static-routes.mjs';
import { withoutXmlComments } from './search/published-addresses.mjs';
import { sitemapDocument } from './generate-sitemap.mjs';

/**
 * The step that decides what a crawler is served.
 *
 * The guard worth naming is the one a deployment step cannot have: a
 * substitution that silently did nothing is a failure here, rather than a
 * published address quietly carrying the site's root as its identity.
 */

const ORIGIN = 'https://navbeacon.app';

const INDEX = [
  '<!doctype html>',
  '<html lang="en"><head>',
  '<title>NavBeacon</title>',
  `<link rel="canonical" href="${ORIGIN}/" />`,
  '<meta name="description" content="What this is." />',
  '<meta name="twitter:description" content="What this is." />',
  '<meta name="twitter:title" content="NavBeacon" />',
  `<meta name="twitter:image" content="${ORIGIN}/assets/link-card.png" />`,
  '<meta property="og:description" content="What this is." />',
  '<meta property="og:title" content="NavBeacon" />',
  `<meta property="og:url" content="${ORIGIN}/" />`,
  `<meta property="og:image" content="${ORIGIN}/assets/link-card.png" />`,
  '<meta property="og:image:alt" content="NavBeacon" />',
  '</head><body></body></html>',
].join('\n');

const HEAD = {
  title: 'Anaconda · NavBeacon',
  description: 'Anaconda: every figure and the slot layout.',
  canonical: `${ORIGIN}/ships/Anaconda`,
  image: `${ORIGIN}/assets/ships/Anaconda/illustration.png`,
  imageAlt: 'Anaconda · NavBeacon',
};

describe('reading the map', () => {
  it('lists the addresses a sitemap advertises', () => {
    assert.deepEqual(advertisedAddresses(sitemapDocument([{ address: `${ORIGIN}/ships` }])), [
      `${ORIGIN}/ships`,
    ]);
  });

  it('reads no address out of a comment', () => {
    const commented = `<urlset>
      <url><loc>${ORIGIN}/ships</loc></url>
      <!-- <url><loc>${ORIGIN}/ghost</loc></url> -->
    </urlset>`;

    assert.deepEqual(advertisedAddresses(commented), [`${ORIGIN}/ships`]);
  });

  it('refuses a comment one pass cannot cut rather than reading half of it', () => {
    // `<!<!-- -->--` leaves `<!--` behind, so a single pass turns the rest of
    // the file into a comment for one reader and not for the other. Refusing is
    // what keeps the deployment and the policy checker reading one file.
    const nested = `<urlset>
      <!<!-- -->-- <loc>${ORIGIN}/ghost</loc> -->
      <url><loc>${ORIGIN}/ships</loc></url>
    </urlset>`;

    assert.throws(() => advertisedAddresses(nested), /nested or contains/);
  });

  it('refuses a map that advertises nothing', () => {
    assert.throws(() => advertisedAddresses('<urlset></urlset>'), /No <loc>/);
  });

  it('cuts a comment without swallowing the markup after it', () => {
    assert.equal(withoutXmlComments('<a/><!-- gone --><b/>'), '<a/><b/>');
  });
});

describe('where a published address is written', () => {
  it('writes an address below the root as a file below the root', () => {
    assert.equal(fileFor(`${ORIGIN}/ships/Anaconda`, ORIGIN), 'ships/Anaconda.html');
  });

  it('writes a top-level address as a file, never as a directory', () => {
    // `ships/index.html` would answer 301 to `/ships/`, which would make the
    // address the sitemap and the canonical both name the one that does not
    // answer.
    assert.equal(fileFor(`${ORIGIN}/ships`, ORIGIN), 'ships.html');
  });

  it('writes the root as index.html, which is the file that answers it', () => {
    // The root used to be refused here, because a redirect is not an address.
    // It is the start page now, and `index.html` is the only file that answers
    // it — a directory document would answer 301 to itself.
    assert.equal(fileFor(`${ORIGIN}/`, ORIGIN), 'index.html');
  });

  it('refuses an address that is not under the origin, and one that names a directory', () => {
    assert.throws(() => fileFor('https://example.test/ships', ORIGIN), /not an address under/);
    assert.throws(() => fileFor(`${ORIGIN}/ships/`, ORIGIN), /ends in a slash/);
  });
});

describe('the document an address answers with', () => {
  it('carries its own canonical, title, description and card', () => {
    const document = documentFor(INDEX, HEAD);

    assert.match(document, /<title>Anaconda · NavBeacon<\/title>/);
    assert.match(document, new RegExp(`rel="canonical" href="${ORIGIN}/ships/Anaconda"`));
    assert.match(document, new RegExp(`property="og:url" content="${ORIGIN}/ships/Anaconda"`));
    assert.match(document, /name="description" content="Anaconda: every figure/);
    assert.match(document, /property="og:description" content="Anaconda: every figure/);
    assert.match(document, /name="twitter:description" content="Anaconda: every figure/);
    assert.match(document, /assets\/ships\/Anaconda\/illustration\.png/);
  });

  it('keeps nothing of the root document it was made from', () => {
    const document = documentFor(INDEX, HEAD);

    assert.ok(!document.includes(`href="${ORIGIN}/"`));
    assert.ok(!document.includes(`content="${ORIGIN}/"`));
    assert.ok(!document.includes('content="What this is."'));
  });

  it('refuses a head that has changed shape rather than publishing an address unchanged', () => {
    // A substitution that silently did nothing looks, in the output directory,
    // exactly like a published address — and tells a crawler to index the root
    // instead, which is the outcome the 404 status had.
    const withoutCanonical = INDEX.replace(/<link rel="canonical"[^>]*>/, '');

    assert.throws(() => documentFor(withoutCanonical, HEAD), /canonical/);
    assert.throws(() => documentFor(INDEX.replace(/<title>[^<]*<\/title>/, ''), HEAD), /<title>/);
    assert.throws(
      () => documentFor(INDEX.replace(/<meta property="og:image:alt"[^>]*>/, ''), HEAD),
      /og:image:alt/,
    );
  });

  it('escapes what would otherwise end the attribute it is written into', () => {
    assert.equal(
      attribute('a "quoted" <tag> & more'),
      'a &quot;quoted&quot; &lt;tag&gt; &amp; more',
    );

    const document = documentFor(INDEX, { ...HEAD, description: 'He said "no" & left' });
    assert.match(document, /content="He said &quot;no&quot; &amp; left"/);
  });

  it('writes a dollar sign as a dollar sign rather than as what it once matched', () => {
    // `$&`, `` $` ``, `$'` and `$1` are expanded by a replacement string after
    // the escaping has run, which splices the matched markup — quotes and all —
    // back in behind it. A value holding one is a message somebody translates
    // or a name a package pin move introduces, so the attribute it lands in has
    // to survive it.
    const injection = "Costs $1 $& $` $' $$";
    const document = documentFor(INDEX, { ...HEAD, title: injection, description: injection });

    // `&` is an entity in both, as it is for any other value; every dollar
    // sign is itself, and nothing the pattern matched came back with it.
    assert.equal(document.match(/<title>([^<]*)<\/title>/)[1], "Costs $1 $&amp; $` $' $$");
    assert.match(document, /content="Costs \$1 \$&amp; \$` \$' \$\$"/);
    // One description tag, not a document that grew a second one out of a value.
    assert.equal(document.match(/<meta name="description"/g).length, 1);
  });
});
