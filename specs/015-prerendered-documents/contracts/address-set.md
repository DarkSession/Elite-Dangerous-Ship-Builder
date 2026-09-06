# Contract: which addresses are generated, where they are written, and who answers

**Feature**: 015 | **Satisfies**: FR-005, FR-006, FR-013, FR-014, FR-015, FR-018, FR-021

Four questions this feature must answer once, in one place each: which addresses
get a document, what file each is written to, which document answers when both a
cached shell and a generated document could, and what the publishing pipeline
does to the builder's output.

## 1. Which addresses

| Set                  | Count | Gets a body |
| -------------------- | ----- | ----------- |
| Advertised addresses | 52    | —           |
| Content-bearing      | 50    | yes         |
| Head only            | 2     | no          |

The 50: the root, `ships`, and 48 hull addresses. The 2: `outfitting` and
`equipment`.

**Rules**

- The set is derived from the installed package through
  `publishedAddresses`. No hull is listed by hand (FR-006, constitution II).
- Content-bearing is a recorded property of an address, not a rule inferred at two
  call sites. It lives in `published-addresses.mjs` beside the list it qualifies,
  and the build and the gate read the same export (FR-021).
- **An advertised address that is neither generated nor recorded as content-free
  fails the build** (FR-021). A new address cannot be added without someone
  deciding which it is.
- All 52 keep the head feature 011 gave them, so
  `e2e/search-published.spec.ts:102-119` — every `<loc>` answers 200 with its own
  canonical — keeps passing unchanged.

## 2. Where each is written

**Rule: `<address>.html`, never `<address>/index.html` — and the root is
`index.html`, because no other file answers it.**

GitHub Pages serves `/ships` from `ships.html` with a 200 and no redirect. From a
directory it answers **301 to `/ships/`**, which would make the address the
sitemap and the canonical both advertise the one address that does not answer.
`scripts/serve-production.mjs:51-66` mirrors this resolution — `<path>.html`
before the directory — so the end-to-end suite enforces it.

The root is the exception in the other direction. Pages resolves `/` to
`index.html` and to nothing else; `fileFor` already says so
(`publish-static-routes.mjs:169-171`) and `serve-production.mjs` resolves the same
way. **So the root's generated document is `index.html`.** There is no filename to
choose here, which is why the navigation fallback has to move instead — section 3.

Angular's prerenderer writes `<route>/index.html`
(`prerender.js:148`). A build step therefore moves each document into place.

| Address          | Builder writes              | Published as          |
| ---------------- | --------------------------- | --------------------- |
| `''`             | `index.html`                | `index.html`          |
| `ships`          | `ships/index.html`          | `ships.html`          |
| `ships/Anaconda` | `ships/Anaconda/index.html` | `ships/Anaconda.html` |
| any address      | —                           | never a directory     |

The move must leave no directory behind that Pages could resolve: after it,
`dist/navbeacon/browser/ships/` holds hull documents and no `index.html` of its
own.

## 3. Who answers: the service worker rule (FR-014)

This is the clause without which the feature does not work for anyone who has
visited before.

### The problem

Angular's service worker answers a **navigation request** from the cached
`manifest.index` — today `/index.html` — rather than from the network. The default
`navigationUrls` is `["/**", "!/**/*.*", "!/**/*__*", "!/**/*__*/**"]`, and
`/ships/Anaconda` has no dot in its last segment, so it matches. The default
`navigationRequestStrategy` is `performance`, which is cache-first.

Consequence, unchanged: **first visit gets the document from the network; every
later visit gets the cached shell.**

And because the root's document _must_ be `index.html` (section 2), which _is_
that fallback, a repeat visit to any hull would paint **the start page** before
Angular replaced it — a content change and a probable reflow, forbidden by
FR-009. Today this is invisible only because every body is an empty `<app-root>`.

### The rule

**Navigations are network-first, and the navigation fallback is a file that
carries no content.**

1. `ngsw-config.json` sets `"navigationRequestStrategy": "freshness"`. Online, a
   navigation reaches the network and gets the real document. Offline, it falls
   back to the cached shell, so FR-013 and SC-006 hold unchanged.
2. The worker's `index` moves from `/index.html` to **`/index.csr.html`** — the
   content-free client-render shell Angular already emits alongside a prerendered
   root (5,541 bytes in the spike). It is essentially today's `index.html`.
3. The `app-shell` asset group prefetches `/index.csr.html` in place of
   `/index.html`. The root's document is one of the 50 and is fetched like any
   other; prefetching it would put the start page's 8.8kB into every install for
   no gain, and would not make it the fallback in any case.
4. `404.html` becomes a copy of **`index.csr.html`**, not of `index.html`. Pages
   serves it for every unmatched address, so a `404.html` carrying the start
   page's body would state one address's content under every other address —
   the same trap as the fallback, reached through the host instead of the worker.

**So exactly one answers, and which one is stated rather than left to ordering:**

| Situation                               | Answers                                               | Content  |
| --------------------------------------- | ----------------------------------------------------- | -------- |
| Any reader, no service worker           | The generated document                                | Full     |
| First visit, worker not yet controlling | The generated document                                | Full     |
| Repeat visit, online                    | The generated document, network-first                 | Full     |
| Repeat visit, offline                   | `index.csr.html`, then the application                | As today |
| An address with no document             | `404.html`, then the application resolves it (FR-015) | As today |

### What was rejected

| Option                                                           | Why not                                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write the root's document to a filename that is not `index.html` | Pages resolves `/` from `index.html` and nothing else, so the root would answer with a shell while a file nobody requests carried its content           |
| Do nothing; declare the cached shell the winner                  | Legal under FR-014, but a returning Commander keeps today's empty first frame — giving up FR-008 and SC-004 for the people who use the application most |
| Custom `navigationUrls` excluding `/ships/**`                    | Those navigations bypass the worker entirely and break offline, failing `offline-privacy.spec.ts:66-77` and constitution I                              |
| Emit `<address>/index.html` so the worker can hash-match         | Pages 301s a directory — section 2                                                                                                                      |

### The gate this must pass through

`ngsw-config.json` is pinned twice: `serviceWorkerOwnershipViolations` in the
policy checker, and `scripts/check-service-worker-ownership.test.mjs`, which
asserts the exact group-name array (`:63-70`) and the exact `app-shell` file list
(`:105-110`). Three edits to that test are deliberate, not incidental:

- the `app-shell` file list becomes `/index.csr.html` in place of `/index.html`;
- a new assertion pins `config.index` to `/index.csr.html`;
- a new assertion pins `config.navigationRequestStrategy` to `freshness`.

The third is what FR-014 rests on and nothing else asserts. Without it a later
edit could restore the default `performance` and every returning Commander would
silently go back to today's empty first frame with no test failing.

## 4. Where the routes file comes from

`prerender.routesFile` is a newline-separated list the builder reads, with
`discoverRoutes: false` so it is the whole set.

```
generate-prerender-routes.mjs
  → publishedAddresses(...)        the 52
  → filter by contentBearing       the 50
  → one line each, leading slash
  → not committed; regenerated every build
```

Not committed, deliberately: a build input regenerated every build cannot drift
from the address list the way a committed file could. The sitemap stays committed
for the opposite reason — a hull arriving or leaving should show up in review.

The builder joins each line with the configured `baseHref`, so the sub-path
preview build needs no separate handling.

## 5. What `publish-static-routes.mjs` does now

Today the script reads the built `index.html` as its template, copies it to
`404.html`, and writes a head-substituted copy of it to each of the 52 addresses'
files. Run unchanged against a prerendered build it would **overwrite all 50
generated documents with a content-free shell** — the feature would build, pass
its head assertions, and ship nothing. So the script's contract changes, and this
is the change:

| Step                      | Today                                     | After this feature                                                                 |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Template                  | The built `index.html`, for every address | The generated document for that address; `index.csr.html` for the 2 head-only ones |
| `404.html`                | A byte copy of `index.html`               | A byte copy of `index.csr.html` (section 3)                                        |
| Root                      | `index.html`, substituted from itself     | `index.html`, substituted over the root's generated body                           |
| The 48 + `ships`          | Written from the shell                    | Substituted in place, over the body the builder produced                           |
| `outfitting`, `equipment` | Written from the shell                    | Written from `index.csr.html` — unchanged in effect, since that _is_ today's shell |

**Rules**

- The head substitution is unchanged: the same `documentHead(entry, catalogue,
origin)`, the same eleven anchors, the same throw-on-missing-anchor
  (`publish-static-routes.mjs:22-23`), the same function-form `String.replace`.
  What changes is only which document it is applied to (FR-005).
- Ordering is load-bearing. `404.html` is written from `index.csr.html` **before**
  any substitution, so it can never inherit another address's head or body.
- The script MUST refuse to substitute into a document that is not the one for
  that address. A content-bearing address whose generated document is missing is a
  build failure, not a silent fall back to the shell — that failure mode is
  exactly what FR-021 exists to catch.
- The script stays the single writer of published documents, so there is still one
  place that decides what a crawler is served, and it stays under
  `pnpm run test:scripts` and the production journey.
