#!/usr/bin/env node
/**
 * Writes the document each published address answers with.
 *
 * Two mechanisms, because they answer different callers. `404.html` catches
 * every address, which is what a Commander following a deep link needs — but
 * GitHub Pages serves it with a 404 status, and a crawler drops a 404 whatever
 * the body says, canonical link included. So every address the sitemap
 * advertises is also written as a file that answers 200.
 *
 * `<address>.html`, not `<address>/index.html`. Pages serves `/ships` from
 * `ships.html` with a 200 and no redirect; from a directory it answers 301 to
 * `/ships/`, which would make the address the sitemap and the canonical both
 * advertise the one address that does not answer.
 *
 * The copy is not byte for byte. The built `index.html` carries the root's own
 * canonical, card and the application's own title, and an address that kept
 * them would tell a crawler to index `/` instead — the same outcome the 404
 * status had, reached a different way. Each address's document carries its own
 * canonical, `og:url`, title, description and card image, resolved in bundled
 * English from the same catalogue the running application resolves them from.
 * Every substitution is checked rather than assumed, because a silent no-op
 * here looks exactly like a published address.
 *
 * **This used to be a shell block in `ci.yml`.** It reads the sitemap with the
 * same module the policy checker reads it with, which is the whole reason it
 * moved: `sed` and a regular expression cutting the same comments in two
 * languages was a drift that could only be managed, and one module is the fix.
 * It also means what a crawler is served is covered by `pnpm run test:scripts`
 * and by the production journey, rather than by a deployment nobody can run
 * twice.
 *
 *   node scripts/publish-static-routes.mjs [output directory]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { declaredOrigin, documentHead, publishedAddresses } from './search/published-addresses.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Where `ng build` leaves the application. */
export const DEFAULT_OUTPUT = 'dist/elite-dangerous-ship-builder/browser';

/** The file that declares where this application is published. */
const ORIGIN_SOURCE = 'src/app/platform/browser/site-address.ts';

/** The catalogue a document carries before any bundle has run. */
const BUNDLED_ENGLISH = 'src/app/i18n/locales/en.json';

/**
 * A document with its XML comments removed, so nothing inside one is read.
 *
 * The body is "anything but two hyphens" rather than a lazy match, so a comment
 * cannot swallow the live markup that follows it. Spelled exactly as
 * `withoutXmlComments` in `scripts/check-interface-foundations.mjs` spells it:
 * a `<loc>` the two read differently is an address that passes the gate and
 * never gets a file.
 */
export function withoutXmlComments(document) {
  return document.replace(/<!--([^-]|-[^-])*-->/g, '');
}

/**
 * The addresses a sitemap advertises.
 *
 * One cutting pass, then a refusal rather than a second pass. One pass cannot
 * cut everything — a nested opener leaves `<!` `--` behind, and a body holding
 * two hyphens is not cut at all — so an address nobody meant to publish can end
 * up inside what the next reader takes for live markup. Cutting twice is not
 * the fix: it would cut more here than the checker cuts there, which is the
 * drift the single pass exists to prevent. So what is left over is checked
 * instead. `--!>` ends a comment in HTML and ends nothing in XML, and is
 * refused with the other two.
 */
export function advertisedAddresses(sitemap) {
  const body = withoutXmlComments(sitemap);
  if (/<!--|--!?>/.test(body)) {
    throw new Error(
      'A comment in sitemap.xml is nested or contains two hyphens, so the file does not say what it appears to.',
    );
  }

  const listed = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]);
  if (listed.length === 0) {
    throw new Error('sitemap.xml listed no <loc> to publish.');
  }
  return listed;
}

/** An attribute value, with the four characters that would end it escaped. */
export function attribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Text between tags, with the two characters that would open one escaped. */
export function text(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Replaces the `content` of one `<meta>`, or refuses.
 *
 * Refuses rather than adds. `index.html` ships every tag this rewrites, so a
 * miss means the head has changed shape and the substitution that was supposed
 * to carry this address's identity did nothing — which looks, in the output
 * directory, exactly like a published address.
 */
export function withMeta(document, attributeName, key, value) {
  const tag = new RegExp(
    `(<meta\\b[^>]*?\\b${attributeName}\\s*=\\s*(["'])${key}\\2[^>]*?\\bcontent\\s*=\\s*")[\\s\\S]*?(")`,
  );
  if (!tag.test(document)) {
    throw new Error(`The head carries no <meta ${attributeName}="${key}"> to rewrite.`);
  }
  return document.replace(tag, `$1${attribute(value)}$3`);
}

/** Replaces the canonical link's address, or refuses. */
export function withCanonical(document, address) {
  const tag = /(<link\b[^>]*?\brel\s*=\s*(["'])canonical\2[^>]*?\bhref\s*=\s*")[^"]*(")/;
  if (!tag.test(document)) {
    throw new Error('The head declares no canonical link to rewrite.');
  }
  return document.replace(tag, `$1${attribute(address)}$3`);
}

/** Replaces the document title, or refuses. */
export function withTitle(document, title) {
  const tag = /(<title>)[\s\S]*?(<\/title>)/;
  if (!tag.test(document)) {
    throw new Error('The head carries no <title> to rewrite.');
  }
  return document.replace(tag, `$1${text(title)}$2`);
}

/** One address's document, built from the root's. */
export function documentFor(index, head) {
  let document = withTitle(index, head.title);
  document = withCanonical(document, head.canonical);
  document = withMeta(document, 'name', 'description', head.description);
  document = withMeta(document, 'property', 'og:description', head.description);
  document = withMeta(document, 'name', 'twitter:description', head.description);
  document = withMeta(document, 'property', 'og:title', head.title);
  document = withMeta(document, 'name', 'twitter:title', head.title);
  document = withMeta(document, 'property', 'og:url', head.canonical);
  document = withMeta(document, 'property', 'og:image', head.image);
  document = withMeta(document, 'property', 'og:image:alt', head.imageAlt);
  document = withMeta(document, 'name', 'twitter:image', head.image);
  return document;
}

/**
 * The path a published address is written to, relative to the output.
 *
 * An address below the root is a file below the root — `/ships/Anaconda`
 * becomes `ships/Anaconda.html` — because that is an address, not a directory
 * redirect.
 */
export function fileFor(address, origin) {
  const route = address.startsWith(`${origin}/`) ? address.slice(origin.length + 1) : null;
  if (route === null || route.length === 0) {
    throw new Error(`"${address}" is not an address under ${origin}.`);
  }
  if (route.endsWith('/')) {
    throw new Error(`"${route}" ends in a slash, so it names a directory rather than an address.`);
  }
  return `${route}.html`;
}

async function main() {
  const output = join(ROOT, process.argv[2] ?? DEFAULT_OUTPUT);

  const origin = declaredOrigin(await readFile(join(ROOT, ORIGIN_SOURCE), 'utf8'));
  const catalogue = JSON.parse(await readFile(join(ROOT, BUNDLED_ENGLISH), 'utf8'));
  const index = await readFile(join(output, 'index.html'), 'utf8');
  const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8');

  // Every address the map advertises has to answer, and every address that
  // answers has to be one this application serves. The known set is built from
  // the same module the map was, so the only way the two disagree is a sitemap
  // edited by hand.
  const known = new Map(publishedAddresses({ origin }).map((entry) => [entry.address, entry]));

  await writeFile(join(output, '404.html'), index, 'utf8');

  let published = 0;
  for (const address of advertisedAddresses(sitemap)) {
    const entry = known.get(address);
    if (entry === undefined) {
      throw new Error(`"${address}" is advertised but is not an address this application serves.`);
    }

    const file = join(output, fileFor(address, origin));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, documentFor(index, documentHead(entry, catalogue, origin)), 'utf8');
    published += 1;
  }

  console.log(`Published ${published} addresses as documents that answer 200, beside 404.html.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
