# Contract: which addresses are generated, where they are written, and who answers

**Feature**: 015 | **Satisfies**: FR-006, FR-013, FR-014, FR-015, FR-018, FR-021

Three questions this feature must answer once, in one place each: which addresses
get a document, what file each is written to, and — when both a cached shell and a
document could answer — which one wins.

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

**Rule: `<address>.html`, never `<address>/index.html`.**

GitHub Pages serves `/ships` from `ships.html` with a 200 and no redirect. From a
directory it answers **301 to `/ships/`**, which would make the address the
sitemap and the canonical both advertise the one address that does not answer.
`scripts/serve-production.mjs:40-80` mirrors this resolution, so the end-to-end
suite enforces it.

Angular's prerenderer writes `<route>/index.html`
(`prerender.js:148`). A build step therefore moves each document into place.

| Address          | File                                 |
| ---------------- | ------------------------------------ |
| `ships/Anaconda` | `ships/Anaconda.html`                |
| `ships`          | `ships.html`                         |
| `''`             | **not `index.html`** — see section 3 |
| any address      | never a directory                    |

`404.html` stays a byte copy of the content-free shell, written before any
substitution, so it keeps the root's own head and states nothing about another
address.

## 3. Who answers: the service worker rule (FR-014)

This is the clause without which the feature does not work for anyone who has
visited before.

### The problem

Angular's service worker answers a **navigation request** from the cached
`manifest.index` — `/index.html` — rather than from the network. The default
`navigationUrls` is `["/**", "!/**/*.*", "!/**/*__*", "!/**/*__*/**"]`, and
`/ships/Anaconda` has no dot in its last segment, so it matches. The default
`navigationRequestStrategy` is `performance`, which is cache-first.

Consequence, unchanged: **first visit gets the document from the network; every
later visit gets the cached shell.**

And because the root's document would be `index.html`, which _is_ that fallback, a
repeat visit to any hull would paint **the start page** before Angular replaced it
— a content change and a probable reflow, forbidden by FR-009.

### The rule

**Navigations are network-first, and the navigation fallback carries no content.**

1. `ngsw-config.json` sets `"navigationRequestStrategy": "freshness"`. Online, a
   navigation reaches the network and gets the real document. Offline, it falls
   back to the cached shell, so FR-013 and SC-006 hold unchanged.
2. The worker's `index` points at a **content-free** shell — the `index.csr.html`
   Angular already emits (5,541 bytes in the spike), not the root's document.
3. The root's document is served for `/` by the host, and is not the file the
   worker falls back to.

**So exactly one answers, and which one is stated rather than left to ordering:**

| Situation                               | Answers                                              | Content  |
| --------------------------------------- | ---------------------------------------------------- | -------- |
| Any reader, no service worker           | The generated document                               | Full     |
| First visit, worker not yet controlling | The generated document                               | Full     |
| Repeat visit, online                    | The generated document, network-first                | Full     |
| Repeat visit, offline                   | The content-free shell, then the application         | As today |
| An address with no document             | The shell, then the application resolves it (FR-015) | As today |

### What was rejected

| Option                                                   | Why not                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do nothing; declare the cached shell the winner          | Legal under FR-014, but a returning Commander keeps today's empty first frame — giving up FR-008 and SC-004 for the people who use the application most |
| Custom `navigationUrls` excluding `/ships/**`            | Those navigations bypass the worker entirely and break offline, failing `offline-privacy.spec.ts:66-77` and constitution I                              |
| Emit `<address>/index.html` so the worker can hash-match | Pages 301s a directory — section 2                                                                                                                      |

### The gate this must pass through

`ngsw-config.json` is pinned twice: `serviceWorkerOwnershipViolations` in the
policy checker, and `scripts/check-service-worker-ownership.test.mjs`, which
asserts the exact group-name array (`:59-69`) and the exact `app-shell` file list
(`:103-117`). Adding `navigationRequestStrategy` is a deliberate edit to that
test, not an incidental one.

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
