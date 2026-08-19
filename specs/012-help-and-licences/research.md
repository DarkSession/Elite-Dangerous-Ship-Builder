# Research: Help, Licences and Provenance

Research used the accepted feature specs and contracts, constitution 5.0.0, root `LICENSE`, root
`package.json`, `.design/Ship Builder.dc.html`, the current Angular/build/test configuration and the
installed `@elite-dangerous-almanac/core@0.1.3` manifest/legal artifacts. No runtime network source
or hand-maintained package wording is planned.

## Shared modal rather than a help route

**Decision**: Mount one `HelpDialog` with the application frame and open it through an
application-level signal store. The frame's global action and package-backed contextual actions emit
the same `open(source)` intent. The modal overlays the current capability; close returns to the
unchanged underlying state. It does not invoke Angular Router, alter history or copy a build fragment.

**Rationale**: FR-001 explicitly requires a modal without navigation. One instance prevents the four
copied reference overlays from drifting and works when no build exists. A small store allows deeply
nested package-backed surfaces to request the shared modal without importing a feature component or
duplicating state.

**Alternatives considered**: The previous `/help` route was rejected because it leaves the current
capability and contradicts FR-001. A modal per route, URL/query-driven dialog state and copied legal
blocks were rejected because they duplicate state or mutate navigation. A component-owned boolean
was rejected because it cannot serve every capability cleanly.

## Accepted help content

**Decision**: Keep seven application-owned, localised topic records covering:

1. build links place the build in a URL fragment, which browsers do not send in HTTP requests, but a
   Commander deliberately sharing the URL shares the encoded loadout;
2. the application has no accounts, authentication, uploads, telemetry or server persistence;
3. working/named builds and preferences stay in browser storage, and clearing site data removes
   them;
4. the app shell and bundled data remain available offline after installation, while same-origin
   artwork is available offline only after it has been opened/cached and its temporary absence never
   blocks the capability;
5. every selected engineering grade represents completed 100% quality; validated imported partial
   grades are completed through Almanac or the incoming build is refused before activation;
6. hull catalogue facts are distinct from fitted-build results and from viewing conditions; and
7. the bundled Almanac owns catalogue values, validation and calculations, with no live-game
   currency claim.

Each topic is a stable ID plus question/body message keys. Content review links each topic to the
constitution or accepted feature contract it describes.

**Rationale**: These are exactly FR-010's questions and reflect accepted behavior. Stable records
support ordered rendering, completeness tests and localisation without putting product prose in a
component.

**Alternatives considered**: Copying the reference FAQ was rejected. Its import answer is outside
FR-010 and its statement that partial rolls are retained conflicts with constitution 5.0.0 and
feature 002. Free-form Markdown, remote help and package-owned translations were rejected because
they weaken review, offline delivery or ownership boundaries.

## Exact Frontier disclaimer extraction

**Decision**: At build time, decode root `LICENSE` as strict UTF-8 and locate the unique section
headed `Elite Dangerous game data and imagery (Frontier media-usage notice)`. Within that section,
locate the unique `Under those rules:` marker and take the immediately following non-empty
Markdown-indented block as the project-specific disclaimer. Remove exactly the four-space Markdown
structural prefix from each block line and preserve every other character, line break and internal
space. Reject absent, empty, duplicate, malformed or boundary-crossing matches. Record source path,
language `en`, UTF-8 byte length and SHA-256 with the extracted exact text.

The generated browser module is rebuilt before any Angular command that imports it. Generator and
post-build tests independently re-extract the root source and prove that the runtime string encodes
to the same bytes/hash. No second hand-edited disclaimer is committed.

**Rationale**: The repository `LICENSE` remains the sole wording authority. Parsing a uniquely
anchored Markdown block distinguishes the project-specific quotation from the adjacent Almanac
description and keeps the modal synchronized without embedding the complete licence.

**Alternatives considered**: Copying the paragraph into a translation catalogue/component, using a
hard-coded regex over the quoted wording, embedding the entire `LICENSE`, rendering Markdown, or
fetching the file at runtime were rejected because they duplicate text, permit the wrong excerpt,
violate the “only” boundary or lose first-load availability. Adding translated disclaimer variants
was rejected by FR-006.

## Installed-artifact and identity boundary

**Decision**: Read the application version from root `package.json`. Resolve the exported leaf
`@elite-dangerous-almanac/core/ships/ships`, walk to the installed package root and read its
`package.json` for package name, version and `bugs.url`, matching the repository's existing codec
table generator pattern. Emit one immutable generated manifest for browser consumption.

Only explicit release-workflow evidence whose release version/ref matches the non-placeholder root
version produces `{ kind: 'release' }`. Every other build is `{ kind: 'nonRelease', buildId }`.
CI supplies a bounded immutable build ID; a repository build uses the current commit abbreviation
plus an optional `dirty` marker. The accepted alphabet excludes whitespace, URLs, paths, branch
names, people, machines and account identifiers. If no truthful identifier is available, generation
fails.

**Rationale**: The package export map does not expose its manifest to browser code, but installed
artifacts are available to Node tooling under pnpm. Explicit classification prevents an optimized
build or the current `0.0.0` version from masquerading as a release. Compile-time values work offline
and describe exactly what was built.

**Alternatives considered**: Hard-coded mock versions, reading `pnpm-lock.yaml`, importing an
unexported package subpath, runtime environment files, timestamps, random IDs, branch/user/machine
labels and inferring release status from Angular's production configuration were rejected as stale,
unsupported, nondeterministic, personal or misleading.

## External destinations

**Decision**: Keep one audited application-owned constant for
`https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE`. The generator accepts
only HTTPS, the exact GitHub host/repository/ref/path, and no query, fragment, credentials or port.
This is the sole modal action described as the destination for remaining licence and third-party
terms.

Read the Almanac package-defect destination from installed `package.json#bugs.url`; validate it as
the exact query/fragment-free HTTPS issues URL. Render it in the provenance section as a separate,
specific package-defect action, never as a second legal-details destination. Both use native links,
visible leaving-app/network warnings and `rel="noreferrer noopener"`; nothing opens, prefetches or
probes them before activation.

**Rationale**: A checked-in allowlisted repository licence location is auditable and independent of
developer git remotes. The installed package manifest remains authoritative for its own issue
tracker. Exact URLs make it straightforward to prove that no route, fragment, SLEF or build identity
is appended.

**Alternatives considered**: Deriving URLs from local git remotes, using the current page URL,
linking package notices separately, auto-opening a new window, client-side availability probes and
adding issue templates/query parameters were rejected because they are environment-dependent,
create extra legal destinations, trigger network activity or risk leaking build context.

## Source-distribution terms

**Decision**: Commit exact mirrors of the installed Almanac `LICENSE` and
`THIRD_PARTY_NOTICES.md` under `legal/almanac/`. The generator verifies strict UTF-8, non-empty
content and byte-for-byte equality with the installed package on every checked build. Root `LICENSE`
continues to distinguish the application's MIT grant from Frontier/package material and points
readers to the applicable bundled terms. Package upgrades require an explicit sync command and
review; ordinary build/check commands never rewrite tracked mirrors.

These source-distribution artifacts are not imported into the Angular bundle and are not exposed as
additional modal links. The modal embeds only the root project disclaimer and uses only the root
GitHub `LICENSE` legal-details link required by FR-003.

**Rationale**: A source checkout/archive must carry the terms needed to redistribute package game
data and artwork, even though the concise runtime modal has a deliberately smaller legal boundary.
Exact package copies preserve ownership and avoid a downstream paraphrase.

**Alternatives considered**: Depending on `node_modules` being present in a source archive, copying
package text into root `LICENSE`, silently updating mirrors during builds, embedding all package
documents in the app, or treating MIT as covering package assets were rejected because they make
terms disappear, fork package wording, hide review changes or contradict FR-003/FR-004.

## Initial-load and offline delivery

**Decision**: Eagerly import the generated help manifest and feature 011's bundled English message
entries with the application frame. The shared modal component may instantiate on demand, but all
facts, accepted help text and exact disclaimer bytes are already in the initial JavaScript bundle.
Opening it performs no dynamic import or fetch. Feature 001's app-shell/service-worker policy caches
that initial bundle; other locale catalogues may use feature 011's same-origin loading and bundled
English fallback.

**Rationale**: This satisfies first-load/offline availability without adding a runtime missing,
loading or stale legal state. It also ensures the modal is independent of build data, storage and
artwork cache state.

**Alternatives considered**: Lazy route/component chunks, runtime fetches from `LICENSE` or GitHub,
same-origin JSON help files and service-worker runtime fallback were rejected because opening help
could require a request or produce a degradable legal state.

## Modal composition, responsiveness and accessibility

**Decision**: Reuse feature 011's application frame, dialog/layer, fact list, notice, action and
external-link primitives. The semantic order follows the reference: title/purpose, Help topics,
Versions and data provenance, then Licence. Wide layouts use a centered modal with a bounded
readable measure and internal vertical scrolling; narrow layouts use a full-width bottom sheet with
a persistent header/close action. At 400% zoom or constrained landscape height, the same single
column may fill the viewport. DOM and reading order never change.

The shared dialog supplies `role="dialog"`, `aria-modal="true"`, a visible labelled title and
background isolation. Every entry and close/external action has a visible localised name and at least
the shared 44 CSS-pixel target.
The exact disclaimer is text in a region with `lang="en"` and a visible localised “original English”
statement. Long text and identifiers wrap; no horizontal document or legal-excerpt scroll is used.
No essential interaction depends on hover, animation, icon, color or placement.

**Rationale**: This preserves `.design`'s recognizable desktop/mobile modal treatment while making
the content resilient at tablet/mobile landscape, 200% text, 400% zoom, expanded translation and RTL
framing. Native semantics and one visible order are easier to verify than a custom panel system.

**Alternatives considered**: A fixed 620 px dialog, fixed 82/88% heights, icon-only `?`,
title-attribute naming, route navigation, two-column DOM reordering, clipped disclaimer text and
hover-only provenance were rejected as direct conflicts with the design system, touch,
localisation/reflow or screen-reader requirements.

## Verification strategy

**Decision**: Test at three layers:

- Node tests cover every generator rejection, exact extraction, hashes, version/release identity,
  destination allowlists and package-mirror equality.
- Vitest covers manifest invariants, topic completeness, presenter localisation, store transitions,
  view-model distinctions and component intents/semantics.
- Playwright covers global and contextual entry from no-build and active capabilities, URL/build
  stability, all content, release/non-release fixtures, offline opening/reload, exact destinations,
  no automatic/cross-origin request, modal states, expanded/RTL text, 200% text, actual 400% zoom,
  reduced motion, axe and no-overflow across feature 011's ten Chromium/Firefox projects.

Manual screen-reader protocol verifies that the modal is announced, the background is not traversed
as active content, headings/topics/facts/disclaimer language/warnings are understandable, and the
unchanged underlying capability is available again after close. The documented conformance
statement retains the constitution's keyboard-criteria exclusions.

**Rationale**: Artifact correctness cannot be established by UI tests alone, and an axe pass cannot
prove reading order or meaning. Layered checks place failures at their owning boundary.

**Alternatives considered**: Snapshots, screenshots, one browser, desktop-only checks, axe alone and
manual exact-text review were rejected as insufficient release gates.
