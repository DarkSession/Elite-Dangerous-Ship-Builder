#!/usr/bin/env node
/**
 * A minimal same-origin static file server for the production output.
 *
 * The offline journey needs a real service worker, and a service worker only
 * exists in a production build served over a single origin — the dev server
 * does not register one. This is test infrastructure, not application code: it
 * serves files and nothing else, with no dependency beyond Node itself.
 *
 * It can also stand in for a deployment. `POST /__publish` re-stamps the
 * worker's manifest for the calling browser, which is exactly what publishing a
 * rebuilt application does to it: the manifest's own bytes are what the worker
 * hashes into a version, so a session that reads the new one finds a version it
 * is not running. The application's update journey needs a second deployment to
 * observe, and building the whole application twice to produce one is minutes
 * of runner time for a byte the worker never looks inside. No product code
 * knows this route exists, and a browser that never calls it is served the
 * built manifest unchanged.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/navbeacon/browser');
const port = Number(process.argv[3] ?? 4400);

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.woff2', 'font/woff2'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.webmanifest', 'application/manifest+json'],
]);

/**
 * Resolves a request path to a file inside the output, or null if it escapes.
 *
 * `<path>.html` is tried before the directory, because that is the order GitHub
 * Pages resolves in and this server stands in for it. `scripts/publish-static-routes.mjs`
 * writes `ships.html` beside a `ships/` directory of hull documents, and the
 * whole point of writing the file rather than the directory is that `/ships`
 * answers 200 rather than redirecting to `/ships/`. A server that preferred the
 * directory would serve the journey a different document than the deployment
 * does, and the assertion would be about this file instead of about the site.
 */
async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = resolve(join(root, normalize(decoded)));
  if (!candidate.startsWith(root)) {
    return null;
  }
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      const published = await publishedDocument(candidate);
      return published ?? resolveFile(join(decoded, 'index.html'));
    }
    return candidate;
  } catch {
    return publishedDocument(candidate);
  }
}

/** The `<path>.html` a published address answers with, where one exists. */
async function publishedDocument(candidate) {
  if (candidate.endsWith('.html')) {
    return null;
  }
  try {
    const document = `${candidate}.html`;
    return (await stat(document)).isFile() ? document : null;
  } catch {
    return null;
  }
}

/**
 * How many deployments this browser has asked the server to stand in for.
 *
 * Held in a cookie rather than in the process, because one server serves every
 * project in the run at once. A counter in memory would let one browser's
 * deployment appear in another browser's session, and a journey that asserts
 * "nothing has been published yet" would fail on someone else's publish.
 */
const PUBLICATION_COOKIE = 'edsb-e2e-publications';

function publicationsIn(request) {
  const cookies = request.headers.cookie ?? '';
  const found = cookies
    .split(';')
    .map((pair) => pair.trim().split('='))
    .find(([name]) => name === PUBLICATION_COOKIE);
  const count = Number(found?.[1] ?? '0');
  return Number.isFinite(count) && count > 0 ? count : 0;
}

/** The worker's manifest, stamped for the deployment this browser is being served. */
async function manifest(file, publications) {
  const published = JSON.parse(await readFile(file, 'utf8'));
  published.timestamp = published.timestamp + publications;
  return JSON.stringify(published);
}

const server = createServer(async (request, response) => {
  const path = (request.url ?? '/').split('?')[0];
  const publications = publicationsIn(request);

  if (path === '/__publish') {
    const published = publications + 1;
    response
      .writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `${PUBLICATION_COOKIE}=${published}; Path=/; SameSite=Strict`,
      })
      .end(JSON.stringify({ publications: published }));
    return;
  }

  const direct = await resolveFile(request.url ?? '/');
  // Unmatched paths fall through to the application shell, the way a static
  // host configured for a single-page application does.
  const file = direct ?? (await resolveFile('/index.html'));

  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }

  const headers = {
    'Content-Type': TYPES.get(extname(file)) ?? 'application/octet-stream',
    // The service worker must be able to take control and revalidate.
    'Cache-Control': 'no-cache',
    'Service-Worker-Allowed': '/',
  };

  if (path === '/ngsw.json' && publications > 0) {
    response.writeHead(200, headers).end(await manifest(file, publications));
    return;
  }

  response.writeHead(200, headers);
  createReadStream(file).pipe(response);
});

server.listen(port, () => {
  process.stdout.write(`serving ${root} on http://localhost:${port}\n`);
});
