# Research: Help, Licences and Provenance

Research used the accepted feature specs and contracts, constitution, root `LICENSE`, root
`package.json`, `.design/Ship Builder.dc.html`, the current Angular/build/test configuration and the
installed `@elite-dangerous-almanac/core` manifest/legal artifacts. No runtime network source
or hand-maintained package wording is planned.

## Shared modal rather than a help route

**Decision**: Mount one `HelpDialog` with the application frame and open it through an
application-level signal store. The frame's single action emits
the same `open(source)` intent. The modal overlays the current capability; close returns to the
unchanged underlying state. It does not invoke Angular Router, alter history or copy a build fragment.

**Rationale**: FR-001 requires in-place, navigation-preserving help that works when no build exists;
the modal is the plan-time design decision that satisfies that behavior. One instance prevents the
four copied reference overlays from drifting. A small store allows deeply nested package-backed
surfaces to request the shared modal without importing a feature component or duplicating state.

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

Each topic is exactly one stable ID plus question/body message keys and a non-empty set of
tooling-only governing references to accepted feature requirements or constitution principles. The
validator rejects any missing or duplicate required ID, empty reference set or unresolved reference.
The release content-review gate compares every answer to those sources and rejects contradictions or
unsupported product claims. References are review/build evidence and are neither displayed nor
bundled.

**Rationale**: These are exactly FR-010's questions and reflect accepted behavior. Stable records
support ordered rendering, completeness tests and localisation without putting product prose in a
component.

**Alternatives considered**: Copying the reference FAQ was rejected. Its import answer is outside
FR-010 and its statement that partial rolls are retained conflicts with the constitution and
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
`package.json` for package name and version, matching the repository's existing codec
table generator pattern. Emit one immutable generated manifest for browser consumption.

Only explicit release-workflow evidence whose release version/ref matches the non-placeholder root
version produces `{ kind: 'release' }`. A build outside a declared release workflow is normally
`{ kind: 'nonRelease', buildId }`; incomplete, mismatched or placeholder evidence inside a declared
release workflow fails rather than being silently downgraded. CI supplies a bounded immutable build
ID; a repository build uses the current commit abbreviation plus an optional `dirty` marker. The
accepted alphabet excludes whitespace, URLs, paths, branch names, people, machines and account
identifiers. If no truthful identifier is available, generation fails.

**Rationale**: The package export map does not expose its manifest to browser code, but installed
artifacts are available to Node tooling under pnpm. Explicit classification prevents an optimized
build, or a placeholder version, from masquerading as a release. Compile-time values work offline
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

It is also the **only** destination. FR-009's Almanac package-defect action is withdrawn (spec
clarification 2026-08-25): the design reference draws no such control, and the installed package's
`bugs.url` is therefore not read at all. **Amended 2026-08-25:** the repository-`LICENSE` link is
withdrawn too. The reference draws no control in the modal other than its close, so there is no
anchor, no warning text and no destination rendered anywhere; the address is still validated by the
generator, because a wrong one for the terms the source distribution carries is still a release
failure.

**Rationale**: A checked-in allowlisted repository licence location is auditable and independent of
developer git remotes. An exact URL makes it straightforward to prove that no route, fragment, SLEF
or build identity is appended.

**Alternatives considered**: Deriving URLs from local git remotes, using the current page URL,
linking package notices separately, auto-opening a new window, client-side availability probes and
adding issue templates/query parameters were rejected because they are environment-dependent,
create extra legal destinations, trigger network activity or risk leaking build context. Each of
those objections now applies to rendering any destination at all, which is the outcome the
design-conformance pass reached from the other direction.

## Source-distribution terms

**Decision**: Commit exact mirrors of the installed Almanac `LICENSE` and
`THIRD_PARTY_NOTICES.md` under `legal/almanac/`. Two is the derived count, not an assumed one: the
installed package root was inspected and carries no other terms-bearing file. Its `PROVENANCE/` tree
(`SNAPSHOTS.md` and the per-catalogue `SOURCES.md` files) documents where values were derived from,
not terms under which they are redistributed, so it is deliberately outside the mirror set. So the
conclusion cannot expire silently on an Almanac upgrade, generation fails when the package root gains
an unmirrored top-level `LICENSE*`, `LICENCE*`, `COPYING*`, `NOTICE*` or `*THIRD_PARTY*` file. The generator verifies strict UTF-8, non-empty
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

**Decision**: Eagerly import the generated help manifest, separate generated help-topic catalogue and
feature 011's bundled English message entries with the application frame. The shared modal component
may instantiate on demand, but all facts, accepted help text and exact disclaimer bytes are already
in the initial JavaScript bundle.
Opening it performs no dynamic import or fetch. Feature 011's sole service-worker/base app-shell
policy caches that initial bundle; other locale catalogues may use feature 011's same-origin loading
and bundled English fallback.

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

The shared dialog supplies `role="dialog"`, native modal semantics, a visible labelled title and
background isolation. Every entry and close/external action has a visible localised name and at least
the shared 44 CSS-pixel target.
The exact disclaimer is text in a region with `lang="en"`; the “original English” sentence that
used to sit above it is withdrawn, because the reference draws no such sentence and the language is
declared as a property of the region either way. Long text and identifiers wrap; no horizontal document or legal-excerpt scroll is used.
No essential interaction depends on hover, animation, icon, color or placement.

**Rationale**: This preserves `.design`'s recognizable desktop/mobile modal treatment while making
the content resilient at tablet/mobile landscape, 200% text, 400% zoom, expanded translation and RTL
framing. Native semantics and one visible order are easier to verify than a custom panel system.

**Alternatives considered**: A fixed 620 px dialog, fixed 82/88% heights, icon-only `?`,
title-attribute naming, route navigation, two-column DOM reordering, clipped disclaimer text and
hover-only supplementary text were rejected as direct conflicts with the design system, touch,
localisation/reflow or screen-reader requirements.

## Verification strategy

**Decision**: Test at three layers:

- Node tests cover every generator rejection, exact extraction, hashes, version/release identity,
  destination allowlists, package-mirror equality, exact topic identity/uniqueness, resolvable
  governing references and shipped-locale completeness.
- Vitest covers browser-manifest invariants, presenter localisation, store transitions, view-model
  distinctions and component intents/semantics. Required content review rejects
  contradictory/unsupported claims outside automated semantic tests.
- Playwright covers the wide frame action and the compact action layer from no-build and active
  capabilities, URL/build
  stability, all content, offline opening/reload, the absence of any external destination,
  no automatic/cross-origin request, modal states, expanded/RTL text, 200% text, actual 400% zoom,
  reduced motion, axe and no-overflow across feature 011's ten Chromium/Firefox projects.

Manual screen-reader protocol verifies that the modal is announced, the background is not traversed
as active content, headings, questions, answers, the two version facts and the excerpt's declared
language are understandable, and the unchanged underlying capability is available again after close. The documented conformance
statement says WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

**Rationale**: Artifact correctness cannot be established by UI tests alone, and an axe pass cannot
prove reading order or meaning. Layered checks place failures at their owning boundary.

**Alternatives considered**: Snapshots, screenshots, one browser, desktop-only checks, axe alone and
manual exact-text review were rejected as insufficient release gates.
