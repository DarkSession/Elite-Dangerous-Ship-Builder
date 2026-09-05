# Contract: The document the root address answers with

**Feature**: [014-start-page](../spec.md) | **Owners**: `src/index.html`,
`scripts/search/published-addresses.mjs`, `scripts/publish-static-routes.mjs`,
`scripts/check-interface-foundations.mjs`

Before this feature the root was a redirect, so it was not an address and nothing reconciled
what it said. It becomes one. This contract is what the four files above must agree on.

## Obligations

- **P1** — `''` is declared in the route table with a `title` and a `data.description`, like
  every other addressable route (FR-016).
- **P2** — `''` is no longer in `UNLISTABLE_ROUTES`. `'**'` still is: a wildcard is not an
  address.
- **P3** — `STATIC_ADDRESSES` carries `{ path: '', titleKey: 'app.name',
descriptionKey: 'app.description' }`, and its address resolves to `${origin}/` — which
  `publishedAddresses` already composes correctly for an empty path.
- **P4** — `fileFor` maps the root address to `index.html`. Every other address keeps
  `<route>.html`; nothing else in the publisher changes.
- **P5** — `src/index.html`'s committed head is **bound to the keys the root address
  resolves**, so the served file and the published document say the same thing. Its
  description family — `description`, `og:description` and `twitter:description` — carries
  `app.description`. Its title family — `<title>`, `og:title`, `twitter:title` and
  `og:image:alt` — carries `app.document-title.default`, which is what `resolveDocumentTitle`
  answers for a page named after the product
  (`specs/011-interface-foundations/design/search-visibility.md`, "The product title").
  `e2e/search-visibility.spec.ts` asserts each tag against those keys in all ten projects.
  The head is not the screen's masthead and tagline: those name the screen, and this file
  names the address.
- **P6** — `public/sitemap.xml` advertises `${origin}/`, first in the list, ahead of the tool
  addresses.
- **P7** — the canonical and `og:url` in `index.html` stay `${origin}/`. They were already
  right; this feature must not move them while rewording around them.
- **P8** — `404.html` continues to be a copy of `index.html`, which now describes the entry
  point. That is correct: an unresolvable address lands at the entry point (FR-008), so the
  document it is served describes where it lands.

## What must not change

- The origin. `SITE_ORIGIN` in `src/app/platform/browser/site-address.ts` is untouched, and
  the checker's domain reconciliation must still pass.
- Any hull address, any tool address, or the order they appear in after the root.
- `robots`, the manifest link, the structured-data block, or the preview `noindex` rewrite
  `ci.yml` performs.

## Verification

| Obligation | How it is held                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| P1, P2     | `searchMetadataViolations` already fails an addressable route no published address names — it now covers the root |
| P3, P6     | `scripts/generate-sitemap.mjs` regenerates the map; CI compares it byte for byte against the committed file       |
| P4         | `scripts/publish-static-routes.test.mjs` gains a case asserting the root maps to `index.html`                     |
| P5         | `e2e/search-visibility.spec.ts` against each key, plus `documentTitleParity` in `document-title.spec.ts`          |
| P7, P8     | The checker's existing canonical and `og:url` assertions, unchanged                                               |
| all        | `e2e/search-published.spec.ts` and `search-visibility.spec.ts` extended to the root address                       |
