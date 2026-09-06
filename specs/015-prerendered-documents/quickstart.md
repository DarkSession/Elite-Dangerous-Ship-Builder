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

Expect 50 documents plus the content-free shell and `404.html`.

```bash
# The three shapes, one of each
ls -l dist/navbeacon/browser/ships/Anaconda.html \
      dist/navbeacon/browser/ships.html \
      dist/navbeacon/browser/404.html

# Never a directory — Pages would 301 it
find dist/navbeacon/browser/ships -type d -name '*' | grep -v '^dist/navbeacon/browser/ships$' && echo "FAIL: directory layout" || echo "ok: flat layout"

# Exactly 50 generated documents
node -e "…count against the content-bearing registry…"
```

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
- `e2e/offline*.spec.ts` — unchanged behaviour, proving FR-013 and SC-006.

## 7. The service worker rule holds

The clause the feature depends on ([contracts/address-set.md](./contracts/address-set.md) §3).

```bash
pnpm exec playwright test offline-privacy.spec.ts --project=chromium-desktop
```

Manually, against `pnpm exec node scripts/serve-production.mjs`:

1. Open `/ships/Anaconda`, let the worker take control, reload. **Expect** the
   prerendered hull document, not the shell — this is what `freshness` buys.
2. Go offline and reload. **Expect** the cached shell then the application, and
   every capability still working.
3. Repeat-visit `/ships/Anaconda` and watch the first paint. **Expect** never to
   see the start page's content — the trap research decision 9 closes.

## 8. The takeover does not move anything

SC-003 asks for zero pixels of movement. What to measure:

- Cumulative Layout Shift across the takeover, per layout profile, expected `0`.
- No frame between first paint and interactive is emptier than the frame before.
- On `/ships` with a stored session view, the reorder lands **in the takeover
  frame**, not later — the bounded exception ruled in [plan.md](./plan.md).
- On `/ships` with **no** stored view, nothing changes at all.

## A constraint to know before proposing the change

**`e2e:offline` is not run by CI.** `.github/workflows/ci.yml:8-12` names
`policy`, `build:preview`, `codec:capacity`, `e2e:timing` and `e2e:offline` a
contributor's gate rather than the pipeline's. The prerendered documents only
exist in a production build, so **every assertion in sections 1, 2, 6 and 7 is
enforced locally, not by CI**, unless the implementation moves some of it.

Two consequences the implementation must settle:

- SC-005 asks for the accessibility scan over the first frame across the ten
  projects. Either that coverage runs somewhere CI runs, or SC-005 is a
  contributor's gate. This is a decision, and it belongs in `tasks.md`.
- FR-020's package comparison is deliberately a **script** test rather than an
  end-to-end one, precisely so CI runs it. Keep it there.

**PR previews have no generated documents either.** `ci.yml:426-439` runs
`ng build` directly rather than `pnpm run build`, so a reviewer following a
preview link sees today's behaviour. If the prerendered first frame should be
reviewable, that job needs a step.

## Full gate

```bash
pnpm run check
```

Format, help artifacts, sitemap check, typecheck, build, preview build, policy,
codec capacity, script tests, unit tests at 80%, Playwright, timing, offline.
This is what must pass before the change is proposed.
