#!/usr/bin/env node
/**
 * A minimal same-origin static file server for the production output.
 *
 * The offline journey needs a real service worker, and a service worker only
 * exists in a production build served over a single origin — the dev server
 * does not register one. This is test infrastructure, not application code: it
 * serves files and nothing else, with no dependency beyond Node itself.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/elite-dangerous-ship-builder/browser');
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

/** Resolves a request path to a file inside the output, or null if it escapes. */
async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = resolve(join(root, normalize(decoded)));
  if (!candidate.startsWith(root)) {
    return null;
  }
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      return resolveFile(join(decoded, 'index.html'));
    }
    return candidate;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  const direct = await resolveFile(request.url ?? '/');
  // Unmatched paths fall through to the application shell, the way a static
  // host configured for a single-page application does.
  const file = direct ?? (await resolveFile('/index.html'));

  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': TYPES.get(extname(file)) ?? 'application/octet-stream',
    // The service worker must be able to take control and revalidate.
    'Cache-Control': 'no-cache',
    'Service-Worker-Allowed': '/',
  });
  createReadStream(file).pipe(response);
});

server.listen(port, () => {
  process.stdout.write(`serving ${root} on http://localhost:${port}\n`);
});
