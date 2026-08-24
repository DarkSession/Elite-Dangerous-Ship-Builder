# Research: SLEF Import and Export

Research used the accepted feature spec, constitution, feature 001/002/011 design contracts,
the current repository, `.design/Ship Builder.dc.html`, and the installed
`@elite-dangerous-almanac/core` source. Package probes used generated or public fixture data
only.

## Decision 1: the Almanac owns SLEF inspection, construction and serialization

**Decision**: Import `inspectSlef` and its records from
`@elite-dangerous-almanac/core/ships/slef`; pass it the exact input string. After one accepted entry,
construct with `ShipLoadout.fromLoadout(entry.data)` from the `ships/ship-loadout` leaf. Export only
with `ShipLoadout.toSlefString()`.

**Rationale**: `inspectSlef` performs the package JSON parse and public-shape validation, accepts a
standard array, one envelope or a bare journal `Loadout`, and returns frozen structured diagnostics.
Its returned `entry.data` is already package-validated, so `fromLoadout` avoids parsing a second time
while retaining the same package construction path. `toSlefString` always emits exactly one entry.

**Alternatives considered**: Application `JSON.parse`, a private schema, event/envelope heuristics,
`fromSlef(..., 0)` without a cardinality gate, share-link recognition and repair of malformed input
were rejected.

## Decision 2: original UTF-8 bytes gate before empty/cardinality checks

**Decision**: Measure `new TextEncoder().encode(text).byteLength`. If it exceeds 65,536, return
`tooLarge` before any whitespace or package work. Then reject whitespace-only input as `empty` without
changing the string. Pass all other text untouched to `inspectSlef`.

**Rationale**: FR-008 requires every larger input to receive the limit failure; checking empty first
would misclassify an oversized whitespace payload. JavaScript string length counts UTF-16 code units,
not UTF-8 bytes. Trimming or normalizing would inspect different evidence from what the Commander
provided.

**Alternatives considered**: `string.length`, textarea `maxlength`, trimming before inspection and an
empty-first gate were rejected.

## Decision 3: observed cardinality includes valid and rejected entries

**Decision**: Define observed count as `inspection.entries.length + inspection.diagnostics.length`.
Accept only observed count one, one valid entry and zero diagnostics. Zero, multiple and mixed
valid/invalid arrays are refused whole; all returned diagnostics remain available beside a
cardinality failure.

**Rationale**: Every top-level array item yields exactly one valid entry or one diagnostic;
non-arrays are one candidate item and `[]` yields zero. This preserves top-level input cardinality and
never selects the first usable build silently.

**Alternatives considered**: Counting valid entries only, dropping mixed diagnostics and choosing
index zero were rejected.

## Decision 4: diagnostics remain exact package data and use package locale presentation

**Decision**: Retain exact `index`, `path`, `code`, `constraint`, `params` and canonical `message`.
Presentation asks `getSlefDiagnosticMessage(diagnostic, locale)` through feature 011's package-text
presenter. A locale miss uses the canonical package message with the standard untranslated
disclosure. App-owned syntax/cardinality/limit framing is localized separately. Do not parse thrown
or diagnostic prose.

**Rationale**: FR-011 requires stable structured detail, while Constitution VI makes package
diagnostic text package-owned. `SyntaxError`, an unknown hull and unexpected construction exceptions
do not expose `SlefDiagnostic`; the app may classify the workflow failure but must not invent a
package code/path/reason.

**Alternatives considered**: Flattening diagnostics, privately translating codes, showing undisclosed
English in a non-English UI and extracting facts from exception messages were rejected.

## Decision 5: import supplies source evidence to one shared ingress normalizer

**Decision**: Before construction, the shared feature 002 ingress boundary records:

1. unknown-hull refusal;
2. every supported resolved source module with validated finite `Engineering.Quality` in `[0, 1)`.

Construct through the package boundary, which returns every fixed mount populated, correlate each
remaining partial to its constructed slot and symbol, and call `completeEngineeringGrade(slotKey)` only for
those source partials. Every must return `normalized`; `unsupported` refuses atomically and
`unchanged` for a source partial is a package-contract failure. Never call the method for absent
quality or quality `1` because complete locked/final articles may correctly return `unsupported`.

Do not call `repairFixedMount()`, compare source/constructed fixed mounts or retain defaulting
provenance; fixed defaults are ordinary package-returned candidate state.

**Rationale**: Package construction establishes the fixed-mount invariant before quality handling,
while exact source evidence still triggers partial-quality refusal.

**Alternatives considered**: Adding unknown-module compatibility, a SLEF-only normalization loop,
normalizing every engineered module, scalar quality mutation, a second fixed-mount repair,
application default lookup and accepting unsupported partials were rejected.

## Decision 6: feature 001 owns the only commit and persistence effects

**Decision**: Inspection and ingress produce a detached candidate plus metadata. Feature 004 hands
that result and an opaque request token to feature 001's replacement coordinator. It does not set
active provenance, confirm, autosave, update the fragment or reset history itself. On acceptance,
feature 001 commits once as `working`, navigates to `/build` where needed, autosaves the tab working
record, synchronizes the fragment, and notifies feature 002 to reset history. Cancellation,
supersession or failure changes none of those states.

**Rationale**: This keeps one active-build transition shared by stock, record, link and SLEF ingress
and prevents an implementation dependency cycle. Feature 001 core does not import feature 004; the
top-level composition wires shell/workspace import/export intents to feature 004.

**Alternatives considered**: Adding `slef` active provenance, committing inside the SLEF store,
writing before confirmation and importing feature 004 from feature 001 domain/application code were
rejected.

## Decision 7: keep detailed quality outcome transient

**Decision**: Bind what an accepted import reports to the committed active revision — through
feature 002's completion notice and feature 003's rail, not a feature-004 surface
([design/import-outcome.md](./design/import-outcome.md), "Divergence"). Quality completion,
remaining validation issue details and full validation presentation are transient/dismissible
workspace feedback. Feature 001 independently persists the accepted revision's `valid`/`complete`
booleans as ordinary record-list metadata. Fixed defaults need no outcome or provenance. The detailed
outcome enters neither modelled snapshot, edit history, link nor SLEF payload.

**Rationale**: FR-012 requires durable-enough post-layer quality disclosure while package construction
already guarantees fixed state.

**Alternatives considered**: SLEF custom properties, putting reports in the build snapshot and
dropping the report when the layer closes were rejected.

## Decision 8: export one sparse current-retail artifact

**Decision**: Call exactly:

```text
loadout.toSlefString({
  header,
  moduleOrder: 'fitted',
  explicitPower: false,
  indent: 2
})
```

Read package validation for disclosure only; invalid or incomplete builds remain exportable.
Default export emits current catalogue-retail values. Historical source values do not enter the
application model and are never requested. Engineering, symbol replacement/removal and
package-defaulted fixed construction are reflected by the package's current fitted-build pricing.

**Rationale**: Fitted order and sparse power preserve absence/order; readable indentation supports
selection; default retail mode satisfies FR-005 without application price logic. Explicitly captured
`On: true` and `Priority: 0` still survive. The package recomputes or omits derived top-level figures.

**Alternatives considered**: `JSON.stringify(toLoadoutEvent())`, source credits, forced power fields,
application pricing/invalidation rules and blocking invalid builds were rejected.

## Decision 9: separate condition snapshots from engineered integrity

**Decision**: Captured per-module `Health` is transient condition, not application build state. The
application neither reads nor rewrites that field, and its presence or omission in package-owned SLEF
serialization does not affect acceptance or round-trip success. Module integrity is different: it is
the package-derived maximum integrity of the current fitted and engineered configuration, so
integrity values/results remain in build presentation and round-trip verification.

Compare hull, slot/module identity/order, ordinary and identified pre-engineering, completed
grade/effect, enabled state, priority, ship name/ident, current retail and package-derived integrity.
Permit
package identity casing normalization and recomputation/omission of derived top-level `UnladenMass`,
`CargoCapacity`, `FuelCapacity` and `MaxJumpRange`. Ignore capture-only `timestamp`, `ShipID`,
per-module `Health`, `Hot`, ammunition and engineer/blueprint numeric provenance.

**Rationale**: A ship builder models the configured maximum capability, not battle damage at capture
time. Treating `Health` as opaque package serialization avoids a local format rewrite while retaining
the integrity characteristic the Commander needs to evaluate the build.

**Alternatives considered**: Locally deleting module `Health`, using it to scale integrity, mutating
raw input, byte equality, echoing source aggregates and presenting other capture/engineer instance
fields were rejected.

## Decision 10: honest build metadata and exact-revision optional link

**Decision**: Generate stable application name/version metadata at build time from repository
configuration and `package.json#version`; never fetch runtime configuration or copy mock versions.
Take one atomic feature 001 snapshot containing active loadout, active revision and a certified
same-origin canonical `/build#b.…` URL for that same revision when available. Include that URL as
`appURL`; omit pending/refused/stale/invalid link state and do not call or retry the codec.

**Rationale**: The header identifies the actual producer/release, and only a revision-matched link is
equivalent to the artifact. Export must remain independent of link encoding failure.

**Alternatives considered**: Hard-coded versions, concatenating base paths in feature 004, stale
published fragments, encoding during export and failing SLEF when link publication fails were
rejected.

## Decision 11: one immutable artifact feeds every delivery path

**Decision**: Key `SlefExportArtifact` to the active revision and retain its exact payload/bytes.
Selectable text, download, clipboard and Web Share receive that same value. A modelled edit or
replacement invalidates it before another action can use it; delivery failure never regenerates it.

Use injected ports:

- async Clipboard `writeText` after an explicit action;
- Blob/object-URL download with a fixed safe filename and JSON UTF-8 type;
- Web Share shown only when `navigator.share` is callable, preferring `File` only when
  `navigator.canShare({ files })` accepts it and otherwise sharing text.

Share must remain in the transient user activation. Treat `AbortError` as cancellation, not failure.
Download can report `dispatched` or `setupFailed`; it cannot claim the browser/user saved the file.

**Rationale**: Browser permissions and Web Share support vary. Independent fallbacks and exact bytes
satisfy FR-004 without fake success or automatic transmission.

**Alternatives considered**: `document.execCommand`, automatic retry/share, UA sniffing, a mobile
share replacement for download, untrusted filenames and a generic delivery “success” state were
rejected.

## Decision 12: compose feature 001 Link and feature 004 SLEF in one exchange layer

**Decision**: Retain the `.design` single Export Build layer. Its accessible mode control exposes
feature 001's Share Link mode and feature 004's SLEF mode; feature 004 contracts only SLEF content.
Journal and Markdown modes are omitted. Import is available through the shared shell on ship
selection and build hosts, including a no-build workspace; export opens only with an active build.
Successful import from a non-workspace host navigates to `/build`; ordinary open/close/failure keeps
the host route and history.

**Rationale**: This respects the accepted feature 001 composition and the reference's exchange
hierarchy without code-import cycles or extra routes.

**Alternatives considered**: Separate export dialogs, a feature 004-only no-tab layer, `/import` or
`/export` routes, journal/Markdown implementations and exporting a selected library record were
rejected.

## Decision 13: responsive and semantic behavior is available-space driven

**Decision**: Use a contained dialog when content fits, the reference bottom sheet on ordinary narrow
portrait layouts, and a vertically scrollable full-height layer for short landscape, 200% text,
400% zoom or expanded/RTL copy. All actions remain present and wrap/stack; JSON and diagnostic paths
own bounded internal wrapping/overflow. Background content is inert and hidden from the accessibility
tree.

Shared components provide a visible heading, description, programmatically labelled multiline field,
associated byte/error state, structured diagnostic list, validation/notice presentation, semantic
mode control, named actions and concise announcement events. App text/counts use feature 011
catalogues/formatters; technical content is direction-isolated; status has text equivalents and does
not rely on color. Every meaningful state has desktop/tablet/mobile previews including expansion,
RTL and reduced motion.

**Rationale**: Canvas widths are examples, not breakpoints. Component-owned semantics and adaptive
composition preserve equal capability at all constitutional form factors.

**Alternatives considered**: Fixed 560/760-pixel panels, device detection, hidden mobile actions,
title/placeholder-only labels, color-only feedback and axe as the sole proof were rejected.

## Decision 14: test package behavior, atomic application state and browser effects separately

**Decision**: Unit/contract tests cover UTF-8 boundaries, all inspector shapes/cardinality,
diagnostic preservation/presentation, construction/normalization outcomes, quality-first ordering,
quality-outcome split, source credits, derived-field round trips, exact-link inclusion, artifact
invalidation and browser-port outcomes. Discover the maximum-slot hull from package data at test time
and populate supported fields through package APIs; require import/export under 500 ms.

Playwright uses feature 011's ten Chromium/Firefox viewport-orientation projects and scans every
relevant layer, confirmation, outcome, unavailable and delivery state with axe plus semantic,
target-size, overflow, reduced-motion, doubled-copy, RTL and 200%-text assertions. Reject unexpected
requests. Keep actual 400% browser zoom and NVDA/Firefox, TalkBack/Chromium (and materially different
tablet) screen-reader scripts as recorded manual gates.

Generate a hashed reference-export corpus from the current application and record successful import
of every artifact into both Coriolis and EDSY. The compatibility record names each consumer's exact
release/build, date, corpus hash and result. Prefer locally pinned releases where distributable;
otherwise use a deliberate manual importer check with synthetic/non-personal data. Static fixtures
originating from those tools remain useful parser inputs but are not evidence that they accept newly
generated output. Runtime and automated tests make no remote consumer request.

**Rationale**: Package tests prove domain fidelity; state snapshots prove atomicity; mocked ports
prove exact browser handoff without sending real data; the shared browser matrix proves responsive
capability. Automated zoom emulation is not a substitute for actual 400% zoom.

**Alternatives considered**: Hard-coded game fixtures, treating consumer-originated fixtures as
output acceptance, runtime/networked compatibility probes, Chromium-only tests, axe-only
accessibility and claiming automated browser zoom coverage were rejected.

## Dependency and gate conclusion

- The Almanac satisfies inspection, structured diagnostics, quality completion, package-populated
  fixed mounts, default current-retail export and package-derived integrity. Captured module `Health`
  remains outside application state.
- Feature 011 and feature 001 core are implementation prerequisites. Feature 002's shared ingress
  contract is also required.
- Feature 004 must consume those foundations rather than create temporary shells, locale logic,
  active-build storage or test-matrix substitutes.

No design clarification remains and no feature-specific package blocker is open; the package owns
fixed-mount construction. No application workaround is permitted.
