# Quickstart: validating prerendered documents

**Feature**: 015 | **Date**: 2026-09-06 | **Plan**: [plan.md](./plan.md)

How to prove this feature works. Every command below was run against this
checkout during Phase 0, except where marked as needing the implementation.

## Prerequisites

- **Node 24.** `.nvmrc` says `24`, and the Angular CLI refuses anything below
  22.22.3. A container may default to something older:

  ```bash
  nvm install 24 && nvm use 24 && node -v
  ```

- `pnpm install --frozen-lockfile`
- `@angular/ssr` and `@angular/platform-server` at the Angular pin, with peers met
  (research decision 12).

## 1. The build produces documents

```bash
pnpm run build
```

Expect 50 generated documents — `index.html` among them — plus the content-free
`index.csr.html`, a `404.html` copied from it, and the 2 head-only addresses.

```bash
cd dist/navbeacon/browser

# The four shapes, one of each
ls -l ships/Anaconda.html ships.html index.html index.csr.html

# The root's document has a body; the shell and the 404 page do not
grep -c 'Nav Beacon' index.html                    # > 0
grep -q '<app-root></app-root>' index.csr.html && echo "ok: shell is content-free"
cmp index.csr.html 404.html && echo "ok: 404 copies the shell, not the start page"

# Never a directory — Pages would 301 it
[ -e ships/index.html ] && echo "FAIL: directory layout left behind" || echo "ok: flat layout"

# Exactly 50 generated documents, against the content-bearing registry
node -e "…count against the content-bearing registry…"
```

The `cmp` is the one to watch. Today `404.html` is a byte copy of `index.html`
(`publish-static-routes.mjs:192`) and that was harmless because every body was
empty. After this feature `index.html` carries the start page, so an unchanged
copy would answer every unmatched address with the start page's content
([contracts/address-set.md](./contracts/address-set.md) §3).

## 2. A reader that runs no script sees the content

The point of the feature. No browser, no JavaScript — just the bytes.

```bash
# Every figure FR-002 names, from the file on disk
python3 - <<'PY'
import re
h = open('dist/navbeacon/browser/ships/Anaconda.html').read()
body = h.split('<body>')[1]
text = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.S)
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\s+', ' ', text)
for k in ['Faulcon DeLacy', 'speed', 'Shield', 'Mass', 'Crew', 'lock', 'huge', 'large']:
    print(f"{k:20} {'FOUND' if k.lower() in text.lower() else 'MISSING'}")
PY
```

**Phase 0 result**, from the spike on `ships/Adder/index.html`: every one found.
The body opened `Adder Zorgon Peterson · Small landing pad` and carried the
catalogue's 48 rows with hardpoints and prices.

Also check the heading, which a reader applying no CSS resolves by document order:

```bash
python3 -c "
import re,sys
h=open('dist/navbeacon/browser/ships/Anaconda.html').read()
print(re.findall(r'<h1[^>]*>(.*?)</h1>',h,re.S)[:2])"
```

Expect two `<h1>` elements and **`Anaconda` first** — the shell renders one bar
composition and hides the other with `display: none`, so exactly one is on screen
and in the accessibility tree, and the narrower composition's comes first in the
markup (`design/first-frame.md`, FR-019).

## 3. The figures match the package

```bash
pnpm run test:scripts
```

Runs `scripts/check-prerendered-documents.mjs` (FR-020), which imports the pinned
package and compares. CI runs this (`ci.yml:122-123`).

## 4. Nothing forbidden is in a document

```bash
pnpm run policy
```

`productionOutputViolations` walks `dist/navbeacon/browser` and fails on
cross-origin URLs and preview markers. The script test above adds the Commander
data and application version checks (FR-007, research decision 14).

## 5. The address set is complete and reconciled

```bash
pnpm run search:sitemap:check   # the committed sitemap still matches the package
pnpm run policy                 # every advertised address is generated or recorded content-free
```

`pnpm run build` runs `publish-static-routes.mjs`, which now substitutes each
address's head **over that address's generated document** rather than over the
shell (address-set.md §5). To prove that is what happened rather than the old
behaviour, check a hull document has both its own canonical and its own body:

```bash
grep -o 'rel="canonical" href="[^"]*"' dist/navbeacon/browser/ships/Anaconda.html
grep -c 'Faulcon DeLacy' dist/navbeacon/browser/ships/Anaconda.html   # > 0
```

A document with the right canonical and an empty body is the failure mode this
step exists to catch: the script ran, and it overwrote what the builder made.

FR-021: an address that is neither must fail the build. To prove the gate bites,
add an address to the route table and the sitemap without recording it, and
confirm `pnpm run policy` names it.

## 6. The first frame, in a real browser, on every profile

```bash
pnpm run e2e:offline
```

Runs the production suite, which builds first
(`playwright.config.ts:262-270`) — so the documents exist. Includes:

- `e2e/search-published.spec.ts` — every `<loc>` answers 200 with its own
  canonical, and now that the body states its subject. Uses
  `page.request.get(..., { maxRedirects: 0 })`, which **bypasses the service
  worker**, so it tests the files on disk.
- `e2e/prerendered-first-frame.spec.ts` (new) — the takeover moves nothing, blanks
  nothing, re-composes nothing, on all ten projects; and axe over the document
  before takeover (FR-019).

  **`e2e:offline` names its spec files explicitly** (`package.json:27`), so this
  file does not run until it is added to that list. Adding it is part of the work,
  not a consequence of writing the file — without the edit, CI would run the new
  job and never run the new test.

- `e2e/offline*.spec.ts` — unchanged behaviour, proving FR-013 and SC-006.

## 7. The service worker rule holds

The clause the feature depends on ([contracts/address-set.md](./contracts/address-set.md) §3).

```bash
pnpm exec playwright test offline-privacy.spec.ts --project=chromium-desktop
```

Manually, against `pnpm exec node scripts/serve-production.mjs`:

1. Open `/ships/Anaconda`, let the worker take control, reload. **Expect** the
   prerendered hull document, not the shell — this is what `freshness` buys.
2. Go offline and reload. **Expect** `index.csr.html` then the application, and
   every capability still working.
3. Repeat-visit `/ships/Anaconda` and watch the first paint. **Expect** never to
   see the start page's content — the trap research decision 9 closes.
4. Open `/ships/NotAShip` offline. **Expect** the shell then the application's own
   handling, never the start page (FR-016, and the `404.html` copy above).

The three assertions the service worker test must carry after this
(`scripts/check-service-worker-ownership.test.mjs`): `config.index` is
`/index.csr.html`, the `app-shell` file list names `/index.csr.html` in place of
`/index.html`, and `config.navigationRequestStrategy` is `freshness`. The last has
no assertion today, so without it a later edit could restore the cache-first
default and every returning Commander would silently go back to today's empty
first frame with nothing failing.

## 8. The takeover does not move anything

SC-003 asks for zero pixels of movement. What `e2e/prerendered-first-frame.spec.ts`
measures, and how it ended up measuring it:

- **Four boxes**, sampled every animation frame and compared: the shell's bar,
  `main`, the screen inside it, and the page. Not Cumulative Layout Shift, which
  the plan expected: `layout-shift` entries are Chromium-only and half the matrix
  is Firefox, so a CLS assertion would cover five projects and skip five, which
  the constitution forbids. Measured with the bundle held back half a second, so
  the document is finished and wearing the typeface it asked for well before the
  application reaches it — otherwise the takeover lands among the same handful of
  frames the page is still settling in, and the measurement is of the machine.
- **No frame is emptier than the frame before**, measured from the frame the
  document finished arriving in. A 293 KB document paints while it is still being
  read, so the earliest frames genuinely hold less of it; that is the download,
  not the takeover (research decision 17).
- **The subject is painted in a frame the application has not reached yet.** Made
  with the bundle held back half a second, because on a static server on the same
  machine the takeover can finish before the browser's first animation frame —
  which makes the window unobservable rather than absent.
- On `/ships` with a stored session view, the reorder lands **in the takeover
  frame**, not later — the bounded exception FR-009a allows.
- On `/ships` with **no** stored view, nothing changes at all.
- A German Commander's page is compared with the served document's shape, with the
  untranslated-name disclosures subtracted — the bounded exception FR-011a allows,
  and the reason FR-011 had to be amended (research decision 18).

Two things this deliberately does not measure, both excluded by the recorder
rather than by hand. The web font's `swap` reflow — every page has had it for as
long as it has had a web font, and Firefox at 1112px moved ten pixels under it —
is excluded by starting the box comparison after the last frame that was still
loading a face (`Frame.dressed`), with an explicit expectation that the window
still holds a pre-takeover frame so the assertion cannot empty itself. The
visually hidden line announcing a pending illustration, which retires when the
picture arrives, is subtracted by `RETIRING` before any text is measured.

## What CI runs, and what it does not

**`e2e:offline` runs in CI**, in the `e2e-production` job added by this feature,
and `deploy` gates on it. So sections 1, 2, 6 and 7 above are enforced by the
pipeline rather than by a contributor's memory — which is what SC-005 needs, since
the prerendered documents exist only in a production build.

It is a job of its own rather than part of the sharded matrix: a service worker
and the published documents exist only in a built deployment, and the matrix is
served by development servers. It is not sharded, because a shard would repeat
the production build for each slice.

FR-020's package comparison stays a **script** test rather than an end-to-end
one, because `pnpm run test:scripts` already runs in CI and can import the
package directly. Keep it there.

Still a contributor's gate, deliberately: `pnpm run policy`,
`help:artifacts:check`, `build:preview`, `codec:capacity` and `e2e:timing`. The
last of those is not a cost decision — it measures under CPU throttling, which is
only honest when nothing else runs beside it, and a shared runner cannot promise
that.

**PR previews gain 50 generated documents, and the preview job must be changed
for it.** `prerender` is an option of the `application` builder, so `ng build`
prerenders too: a preview build produces the same 50 documents at the preview
origin. Two existing steps then do the wrong thing, and both are this feature's to
fix because this feature is what breaks them:

- **`ci.yml:533-540` rewrites the robots tag in `index.html` only.** With 50
  documents, 49 would keep `content="index,follow"` and publish full near-duplicates
  of production on another host — precisely the duplicate that step exists to
  prevent, now with content behind it. The rewrite must cover every generated
  document, and the check that it happened must count them.
- **`ci.yml:542-544` copies `index.html` to `404.html`.** After this feature that
  is the start page's document, so every unmatched preview address would answer
  with the start page. It must copy `index.csr.html`, the same file
  `publish-static-routes.mjs` now copies (address-set.md §5).

The upside is that a reviewer following a preview link sees the real first frame,
which is worth having. The two steps above are the price.

## Full gate

```bash
pnpm run check
```

Format, help artifacts, sitemap check, typecheck, build, preview build, policy,
codec capacity, script tests, unit tests at 80%, Playwright, timing, offline.
This is what must pass before the change is proposed.
