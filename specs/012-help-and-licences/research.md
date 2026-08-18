# Research: Help, Licences and Provenance

Research used the accepted feature specifications, constitution, current Angular/build/test setup,
the root `LICENSE` and `README.md`, `.design/Ship Builder.dc.html`, installed
`@elite-dangerous-almanac/core@0.1.0-beta.12`, and the package's manifest, licence, notices and
provenance tree. No runtime network source or hand-maintained package text is planned.

## Installed-artifact boundary

**Decision**: At build time, resolve the exported leaf
`@elite-dangerous-almanac/core/ships/ships`, then locate `package.json`, `LICENSE`,
`THIRD_PARTY_NOTICES.md` and `PROVENANCE/` relative to that resolved module. This is the same package-
root pattern already used by `scripts/generate-build-link-codec-tables.mjs`. Read the application
version and licence from the repository root. Produce one immutable generated TypeScript manifest
for browser consumption.

**Rationale**: The package export map intentionally does not expose its manifest/legal files as
browser subpaths, but the installed artifacts are available to Node tooling. Resolving an exported
leaf works with pnpm's symlinked store and does not assume a registry, backend or runtime filesystem.

**Alternatives considered**: Direct `@elite-dangerous-almanac/core/package.json` imports were rejected
because the export map does not expose them. Reading `pnpm-lock.yaml`, hard-coding the package root,
using Angular's generic `3rdpartylicenses.txt`, fetching GitHub/npm at build or runtime, and copying
text by hand were rejected because they do not prove the shipped package artifacts.

## Exact legal artifacts and source distribution

**Decision**: Treat the root `LICENSE`, installed Almanac `LICENSE` and installed
`THIRD_PARTY_NOTICES.md` as the three required exact documents. Validate each as decodable UTF-8,
non-empty and non-whitespace; record its source path, language (`en`), byte count and SHA-256. Embed
the exact strings in the generated browser manifest. Commit package copies at `legal/almanac/` and
make generation fail unless they are byte-for-byte equal to the installed package. Ship the raw
copies with the static distribution as trace evidence.

The Frontier media-usage notice remains inside the complete application/package documents that
carry it. Localised framing identifies the notice and what it covers; the app does not rewrite,
translate or Markdown-render the legal bytes.

**Rationale**: This simultaneously satisfies first-load/offline delivery, source-distribution terms,
verbatim presentation and traceability to the dependency actually installed. Text-node rendering
prevents package Markdown from becoming executable HTML and preserves exact content.

**Alternatives considered**: Runtime fetches from `public/` were rejected because `/help` would have
a loading/error state and would not have content in the initial application load. Rendering Markdown
to HTML, extracting and rewriting the Frontier paragraph, translating legal text, relying only on a
hash, or letting the build silently refresh committed copies were rejected because each weakens
verbatim/source-review guarantees.

## Inaccurate Almanac notice — upstream blocker

**Decision**: Block implementation until
[Elite-Dangerous-Almanac #307](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/307) is
fixed in a released package and that version is pinned here. Do not patch, annotate inside, omit or
replace the installed notice.

**Rationale**: Beta.12's `THIRD_PARTY_NOTICES.md` says its domain `SOURCES.md` records “live in the
repository only” and are not present in the npm package. The same artifact contains non-empty
`PROVENANCE/SNAPSHOTS.md` and six domain `SOURCES.md` files, its manifest includes `PROVENANCE`, and
its README says the record travels with the installed version. Feature 012 must reproduce the notice
verbatim and describe accepted current behavior; correcting package-owned wording locally violates
both constraints.

Minimal reproduction:

```bash
pnpm add @elite-dangerous-almanac/core@0.1.0-beta.12
test -f node_modules/@elite-dangerous-almanac/core/PROVENANCE/SNAPSHOTS.md
find node_modules/@elite-dangerous-almanac/core/PROVENANCE -type f
rg -n 'repository only|where they are not present' \
  node_modules/@elite-dangerous-almanac/core/THIRD_PARTY_NOTICES.md
```

The test succeeds and `find` lists seven files while `rg` reports the contrary claim.

**Alternatives considered**: A downstream footnote, altered copy, hiding the provenance section and
linking only to GitHub were rejected as package-text forks or incomplete offline disclosure.

## Build and release identity

**Decision**: Generate one discriminated `BuildIdentity` from build-time evidence. The application
version always comes from root `package.json`; the bundled Almanac version always comes from its
installed `package.json`. Only the release workflow may request `kind: release`, and the generator
must verify that its supplied release version/ref equals the non-placeholder application version.
Every other build is `kind: nonRelease` and visibly includes a safe build identifier supplied by CI
or, locally, a commit abbreviation with an optional `dirty` suffix. Permit only a conservative
non-personal identifier alphabet and length; never include a branch, runner, path, account or machine
name. Missing/mismatched release evidence or an unavailable non-release identifier fails generation.

**Rationale**: Production optimisation does not mean a release, and the current `0.0.0` manifest is
clearly not a release. Explicit evidence prevents development builds from masquerading as releases,
while compile-time data keeps the static app deterministic and offline.

**Alternatives considered**: Hard-coded versions, runtime environment files, deployment timestamps,
branch/user/machine labels, random IDs and inferring release state from `ng build --configuration
production` were rejected as drifting, personal, nondeterministic or misleading.

## Initial-load and offline delivery

**Decision**: Eagerly import the `/help` route and generated manifest into the initial Angular bundle.
Feature 001's service worker prefetches the app shell, main bundle, bundled English fallback and raw
legal trace files. The route performs no dynamic import, HTTP request or package lookup. Validate
offline behavior against the production build: after app-shell installation, take the context
offline, reload `/help` directly and read every help topic and full notice.

**Rationale**: The three exact texts are small enough for the existing initial bundle budget and the
feature explicitly requires initial-load availability. Testing `ng serve` alone cannot prove service-
worker caching.

**Alternatives considered**: Lazy route chunks, service-worker data groups, GitHub links as the only
copy, runtime `fetch()` and requiring a build before help appears were rejected because they add a
network/loading boundary to mandatory content.

## Help content ownership

**Decision**: Keep application-owned help as static feature 011 message keys covering exactly the
accepted behaviors:

1. build data in a shared link is confined to the URL fragment, while deliberately sharing the URL
   shares that build;
2. there are no accounts, uploads or telemetry;
3. working/named state uses browser storage, and clearing site data removes it;
4. interface/help/legal/fallback text is bundled offline, while same-origin artwork may become
   available offline only after it has been opened;
5. a selected blueprint grade represents a completed 100% grade and imported partial quality is
   normalised under the accepted product rule;
6. hull facts describe the catalogue hull, while build results depend on fitted modules and viewing
   conditions;
7. the bundled Almanac supplies game catalogue values and calculations, not a claim about the live
   game's current version.

No help copy predicts future behavior or duplicates package-owned game diagnostics.

**Rationale**: These topics answer every question named by FR-010 without becoming a parallel product
specification. Static message assets make them translatable and offline.

**Alternatives considered**: Generic FAQ filler, implementation internals, future promises, raw
English component strings and private translations of package terms were rejected.

## Provenance and package-defect reporting

**Decision**: Present separate localised facts for the application, bundled Almanac, catalogue/data,
calculations, Frontier assets/game data and other third-party sources. Source the external defect
destination from installed `package.json#bugs.url`, validate it at build time as the Almanac HTTPS
issues URL with no query or fragment, and expose it only as a native Commander-activated link whose
visible and accessible label says it leaves the application. Never append a build, route, referrer
payload, query or fragment; use `rel="noreferrer noopener"`. Explain that it is for package data or
calculation defects, not application defects.

**Rationale**: Package ownership stays explicit, and a normal link click is the constitutionally
permitted deliberate external navigation. Deriving the destination from the installed manifest
avoids a second mutable location.

**Alternatives considered**: Automatic issue creation, prefilled issue queries, adding build/SLEF
data, runtime URL discovery, generic unlabeled external links and routing application defects to the
Almanac were rejected.

## Route, UI and accessibility composition

**Decision**: Add one eager `/help` document with sections for help, versions, provenance/defect
reporting and licences. The persistent shell owns the universal entry; package artwork/value regions
compose a shared contextual provenance link, and standard full-screen/modal headers retain a help
action when the shell is obscured. Use semantic headings, definition lists and native
`details`/`summary` disclosures. Render legal text in an English `pre`/text node with wrapping and
long-token breaking. There is no runtime empty/loading/error legal state: generation failure prevents
the app from shipping.

**Rationale**: One document provides a predictable screen-reader order and a responsive narrow stack
without duplicating routes or notices. Native disclosures keep a long 17 KiB notice manageable while
the content remains in the DOM and initial bundle.

**Alternatives considered**: Separate lazy help/about/licence routes, a feature-local modal on every
screen, `innerHTML`, iframe/PDF rendering, fixed-width preformatted overflow and shell-only access
behind an obscuring layer were rejected.

## Design reference treatment

**Decision**: Adopt the reference's persistent help entry and wide-overlay/narrow-sheet information
hierarchy only. Reject its `APP VERSION 4.2.1`, `LIBRARY VERSION 3.8.0.3`, EDASSETS.ORG artwork claim,
typeface licence claim, incomplete three-line licence summary, fixed dimensions, colors and styles.

**Rationale**: Those mock facts do not come from shipped artifacts and some conflict with current
repository provenance. The repository's design system owns visuals; feature 012's generated manifest
owns versions/legal text.

**Alternatives considered**: Copying the mock values or treating the HTML as authoritative legal
content was rejected. Ignoring its useful navigation hierarchy was also rejected.

## Verification strategy

**Decision**: Node tests cover missing, empty, whitespace-only, invalid UTF-8, stale committed copy,
wrong version/ref, unsafe/missing build ID, unsafe issue URL and successful exact generation. Unit
tests cover manifest invariants and localised presentation without altering legal bytes. Production
Playwright covers all help/document states, offline reload, no route request, exact identity labels,
no build mutation, the inert-before-click and exact external URL, all feature 011 viewport/browser
projects, axe, semantic/screen-reader order, 200% text, 400% zoom, expanded/RTL labels and reduced
motion. CI must run script tests as well as the full `pnpm run check` gate.

**Rationale**: Required missing artifacts are release failures, not runtime states. Browser coverage
must prove both static delivery and usable long-form content; generic build licence extraction and an
axe-only pass cannot prove either.

**Alternatives considered**: Snapshotting rewritten Markdown, manual-only licence review, Chromium-
only tests, `ng serve` offline assertions, skipped network tests and lowering coverage were rejected.
