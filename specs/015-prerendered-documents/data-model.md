# Data Model: Prerendered Documents

**Feature**: 015 | **Date**: 2026-09-06 | **Plan**: [plan.md](./plan.md)

This feature stores nothing and adds no runtime state. Its entities are build-time
things: the address list, the documents made from it, and the one new fact about
an address that decides whether a document is made at all.

Everything here already has a home in `scripts/search/published-addresses.mjs`
except `ContentBearing`, which joins it.

## Entities

### AdvertisedAddress

An address the sitemap lists. **Unchanged by this feature**; recorded because the
new entities are defined against it.

| Field                        | Meaning                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `path`                       | Address relative to the origin. `''` for the root                    |
| `route`                      | The route table entry it comes from. `ships/:hull` for a hull        |
| `titleKey`, `descriptionKey` | Message keys, resolved per locale                                    |
| `params`                     | `{ hull: name }` for a hull, `{}` otherwise                          |
| `image`                      | Card image path — the hull's illustration, or `assets/link-card.png` |
| `address`                    | `${origin}/${path}`                                                  |

Derived by `publishedAddresses({ origin, ships })` from the pinned package. There
are 52.

**Rules**

- Derived from the installed package, never listed by hand (FR-006, constitution II).
- Hull order is by code unit on the address string, so a small-icu runner cannot
  reorder the committed sitemap.
- All 52 keep the head feature 011 gave them, whether or not a document is
  generated (FR-005, FR-018).

---

### ContentBearing

**New.** Whether an advertised address has a subject the package can state without
a Commander having acted.

| Field            | Meaning                                                   |
| ---------------- | --------------------------------------------------------- |
| `path`           | The advertised address this answers for                   |
| `contentBearing` | `true` — a document is generated; `false` — head only     |
| `reason`         | Why, for the address that has none. Required when `false` |

**Values**

| Address             | Content-bearing | Reason when not                                             |
| ------------------- | --------------- | ----------------------------------------------------------- |
| `''`                | yes             | —                                                           |
| `ships`             | yes             | —                                                           |
| `ships/<hull>` × 48 | yes             | —                                                           |
| `outfitting`        | no              | A bench states nothing until a Commander fits a ship        |
| `equipment`         | no              | A bench states nothing until a Commander equips a Commander |

**Rules**

- Every advertised address MUST appear exactly once. An address that is neither
  generated nor recorded as content-free fails the build (FR-021).
- One place, read by both the build and the gate, so the two cannot disagree
  (FR-021). Home: `published-addresses.mjs`, beside the list it qualifies.
- `reason` is required when `contentBearing` is `false`, so a future address
  cannot be excluded silently.
- A bench that later gains package-derived resting content becomes
  content-bearing; the registry is where that is stated, not a code change
  elsewhere (spec Clarifications, 2026-09-06).

**Relationships**: one per `AdvertisedAddress`. 50 true, 2 false.

---

### PrerenderRoute

**New, and transient.** One line of the routes file the builder reads.

| Field   | Meaning                                                         |
| ------- | --------------------------------------------------------------- |
| `route` | The address with a leading slash. `/`, `/ships`, `/ships/Adder` |

**Rules**

- Generated from `AdvertisedAddress` filtered by `ContentBearing`, never written
  by hand.
- Exactly 50 lines.
- Not committed. It is a build input, regenerated every build, so it cannot drift
  from the address list the way a committed file could.
- The builder joins each line with the configured `baseHref`, so the sub-path
  preview build needs no separate handling.

**Relationships**: derived from `AdvertisedAddress` + `ContentBearing`. Consumed by
`angular.json`'s `prerender.routesFile`.

---

### PrerenderedDocument

**New.** The HTML a content-bearing address answers with.

| Field     | Meaning                                                              |
| --------- | -------------------------------------------------------------------- |
| `address` | The advertised address it answers                                    |
| `file`    | Where it is written: `<address>.html`, and `index.html` for the root |
| `head`    | Title, description, canonical, `og:url`, card image, card alt        |
| `body`    | The rendered screen, in bundled English                              |

**Rules**

- `head` is what `documentHead(entry, catalogue, origin)` already returns. This
  feature does not change it (FR-005).
- `body` states every figure the contract requires and no other kind of thing —
  see [contracts/prerendered-document.md](./contracts/prerendered-document.md).
- Written as `<address>.html`, never `<address>/index.html`, because Pages answers
  a directory with a 301 (research decision 4).
- The root's document **is** `index.html`, because Pages resolves `/` to that file
  and to no other. The navigation fallback moves off it instead (research
  decision 9, [contracts/address-set.md](./contracts/address-set.md) §2-§3).
- The head is applied by `publish-static-routes.mjs` **over this document**, not
  over a shell. A content-bearing address whose document is missing when the
  script runs is a build failure (FR-005, FR-021, address-set.md §5).
- The first `<h1>` in document order names this address's subject. A document
  carries both of the shell's bar compositions, so `ships/<hull>` carries two
  `<h1>` elements in markup; CSS renders exactly one, and the narrower
  composition's — the hull's own name — comes first.
- Contains no Commander data and no runtime environment configuration, the
  application version included (FR-007, research decision 14).
- Every figure is the package's value, presented and never altered. Where the
  package reports a value unavailable, the document states the absence (FR-004,
  constitution IV).

**Relationships**: one per content-bearing `AdvertisedAddress`. 50 of them.

---

### NavigationFallback

**New as a named thing**, though the file already exists. The content-free document
the service worker returns for a navigation it cannot match.

| Field  | Meaning                                                                            |
| ------ | ---------------------------------------------------------------------------------- |
| `file` | `index.csr.html` — what the worker's `index` points at, and what `404.html` copies |
| `body` | `<app-root></app-root>` — no content, deliberately                                 |

**Rules**

- MUST NOT carry any screen's content. A fallback carrying the start page would
  make a repeat visit to a hull paint the start page first (research decision 9).
- Angular already emits it: `index.csr.html`, 5,541 bytes in the spike —
  essentially today's `index.html`.
- It has **three** consumers, and all three move off `index.html` together: the
  worker's `index`, the `app-shell` asset group's prefetch list, and `404.html`
  (address-set.md §3). A fourth consumer would be a defect; `index.html` is now a
  generated document like the other 49.
- Exactly one of the fallback and a generated document answers any given address,
  and which one is stated rather than left to ordering (FR-014).

---

## What is deliberately not modelled

- **A build.** Not an address, not prerendered, not in any document. It lives in
  the fragment (FR-017, constitution I as amended at 9.1.0).
- **A locale.** Documents are bundled English only. No per-language address
  exists, so there is nothing to key a document by (FR-011, 011/FR-017).
- **A hull's figures.** They belong to `@elite-dangerous-almanac/core` and are
  rendered by the existing components. Restating their shape here would be the
  parallel copy constitution II forbids.
- **Session state.** `filters`, `sort` and `anchor` stay where they are. The
  document states the default view; FR-009a says what the takeover does with a
  stored one.
