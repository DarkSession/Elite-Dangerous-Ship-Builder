# Research: SLEF Import and Export

Research used the installed `@elite-dangerous-almanac/core@0.1.0-beta.12`, the accepted spec,
constitution, feature 001 active-build/build-link contracts, feature 002 normalization research and
`.design/Ship Builder.dc.html`. Runtime probes used detached package values only.

## Decision 1: the Almanac is the only parser and serializer

**Decision**: Pass raw input directly to `inspectSlef` from
`@elite-dangerous-almanac/core/ships/slef`. After exactly one valid entry is established, construct
with `ShipLoadout.fromLoadout(entry.data)`. Export through `ShipLoadout.toSlefString()`.

**Rationale**: The inspector accepts standard arrays, one envelope and a bare journal event, checks
public fields and returns structured package diagnostics. The inspected entry is trusted package
output; the loadout method guarantees one export entry.

**Alternatives considered**: App `JSON.parse()`, schema duplication, event-field heuristics, link
recognition, repair and likely-format decoding were rejected under FR-009.

## Decision 2: byte and cardinality gates are workflow rules

**Decision**: Reject whitespace-only text or original UTF-8 length over 65,536 before inspection. Use
`TextEncoder`; never trim/transform the string given to the package. After inspection, observed entry
count is `entries.length + diagnostics.length`. Accept only count one, one valid entry and zero
diagnostics; retain diagnostics even alongside a cardinality failure.

**Rationale**: The limit is bytes, not UTF-16 characters. Probes returned zero results for `[]`, two
entries for two valid envelopes, one entry plus an index-1 diagnostic for mixed input, one entry for a
bare event, and `SyntaxError` for empty JSON text.

**Alternatives considered**: `string.length`, textarea `maxlength` and choosing the first valid entry
were rejected.

## Decision 3: package diagnostics cross intact

**Decision**: Retain exact `index`, `path`, `code`, `constraint`, `params` and package-owned `message`.
The UI adds localized framing but neither parses nor rewrites the message. A JSON `SyntaxError` gets a
localized syntax category; the app does not fabricate a SLEF diagnostic.

**Rationale**: This preserves FR-011's stable location/reason data and respects package text ownership.

**Alternatives considered**: String flattening, parsing exception prose and invented paths/codes were
rejected.

## Decision 4: import is a detached candidate transaction

**Decision**: Inspection, construction, fixed-mount repair, quality normalization and final package
validation occur on a detached candidate. Only feature 001's replacement coordinator may commit it.
Unsaved work uses the shared confirmation; failure, cancellation or a stale request token discards the
candidate. Success forks/autosaves the working record after commit and resets feature 002 history.

**Rationale**: `ShipLoadout` is mutable. Candidate-first orchestration prevents partial state and
makes stock, record, link and SLEF ingress share one atomic transition.

**Alternatives considered**: Current-instance mutation, pre-normalization autosave and component
special cases were rejected.

## Decision 5: fixed mounts use package defaults before calculations

**Decision**: Share one ingress normalizer. Inspect only `slots()`/`fittedModules()` first. A fixed slot
is package `immovableReason: 'requiredSlot' | 'cargoHatch'`, never `moduleLimit`. Missing modules or
`stats === null` use the exact case-insensitively matched `getDefaultLoadout(shipSymbol)` slot. Report
original/replacement identity. If no package default exists, leave it and surface incompleteness.

For core/armour, package edits can apply the default and preserve package purchase invalidation.
Beta.12 cannot replace immutable cargo hatch with `setModule()`. Rebuilding raw data would force the
app to decide which captured module/top-level credits to invalidate, so a package operation is needed.

**Rationale**: The constitution mandates package-default fill and FR-005 mandates package source
semantics. A probe showed replacing unknown core via `setModule()` drops the old `Value`,
`ModulesValue` and `Rebuy`; raw cargo-hatch reconstruction falsely retains them unless app code
rewrites provenance.

**Alternatives considered**: Local fixed-slot lists/default derivation, retaining the old price or
app-authored credit invalidation were rejected.

## Decision 6: iterating modules cannot universally normalize quality

**Decision**: Use the released Almanac normalization requested by #292. It must normalize ordinary
and package-identified pre-engineering, supported later effects and return structured outcomes for
states it cannot normalize. No supported partial candidate reaches active state before it succeeds.

**Rationale**: Beta.12 imports and re-exports `Quality: 0.42`. Fitted snapshots are frozen and have no
quality setter. Calling `applyBlueprint(..., { quality: 1 })` is correct for a recognized ordinary
recipe, but an application loop cannot safely cover fixed rewards, later effect-only states,
ambiguous/unresolved identities or hand-authored modifier blocks. Changing only `Quality` leaves
partial effective modifiers under a false 100% label; mixing app-side branches violates package truth.

**Alternatives considered**: Scalar mutation, universal `applyBlueprint` iteration, dropping unknown
engineering and app-side modifier merging were rejected.

## Decision 7: reports are local workflow state

**Decision**: A successful report lists each quality completion, fixed fill, fixed default gap and
retained unresolved identity using package slot/symbol/code data. It stays with active workflow notices
and is excluded from loadout, snapshot, local record, build URL and SLEF.

**Rationale**: FR-012 requires disclosure and FR-006 forbids exporting provenance.

**Alternatives considered**: SLEF custom properties, silent normalization and dropping unresolved
optional modules were rejected.

## Decision 8: export uses sparse state and source provenance

**Decision**: Call:

```text
toSlefString({
  header,
  credits: 'source',
  moduleOrder: 'fitted',
  explicitPower: false,
  indent: 2
})
```

Read validation for disclosure only; invalid/incomplete builds remain exportable. Source mode retains
only valid captured values and emits none when provenance is absent. Link failure never fails export.

**Rationale**: These package options retain order and absence, provide selectable readable JSON and
forbid retail fallback.

**Alternatives considered**: `JSON.stringify(toLoadoutEvent())`, retail/default credits, forced power
fields, blocking invalid builds and serializing notices were rejected.

## Decision 9: honest header and opportunistic link

**Decision**: Read the root `package.json` version at build time. Supply stable product identity and
release version. Include feature 001's already-published same-origin canonical URL only when it names
the exact active revision; otherwise omit `appURL` without retrying encoding.

**Rationale**: The version cannot drift, and the optional link is demonstrably equivalent. Export is
independent of link refusal.

**Alternatives considered**: Hard-coded version, runtime config request, stale/noncanonical link and
blocking link generation were rejected.

## Decision 10: delivery is capability-gated and artifact preserving

**Decision**: Inject ports for async Clipboard, Blob/object-URL download and Web Share. Download uses
the exact payload, JSON MIME type and a fixed safe filename. Show share only when `navigator.share`
exists; prefer a file when `canShare({files})`, otherwise share text. Every failure/cancel leaves the
same selectable artifact and alternate actions.

**Rationale**: Browser permission/capability failures are normal. One immutable artifact prevents
divergent outputs and guarantees fallback. Web Share opens only from a Commander gesture; no automatic
request/transmission occurs.

**Alternatives considered**: `execCommand`, fake success, automatic share, hidden fallback and
unavailable share buttons were rejected.

## Decision 11: adapt the reference, not its mock behavior

**Decision**: Adopt the reference's wide dialogs and ordinary narrow bottom sheets, escalating the
same logical content to a full-height layer in constrained landscape or at 400% zoom. Retain the
monospaced field, metadata and action weight. Import keeps editable text plus diagnostics; export
has one SLEF format only. Replace mock controls/literals with feature 011 primitives/tokens and 44
CSS px targets.

**Rationale**: The visual hierarchy is useful, but the mock uses heuristic parsing, fake delivery,
invented links/versions, no limit/cardinality/atomicity and says partial rolls remain partial.

**Alternatives considered**: Copying HTML/JS, retaining out-of-scope tabs or ignoring the reference
were rejected.

## Decision 12: package fixtures and observable browser tests

**Decision**: Unit tests cover every input/result kind, ASCII/multibyte byte boundaries, mixed
diagnostics, normalization, source credits, link omission and delivery outcomes. Package fixtures
cover ordinary/pre-engineered/effects, false enabled, priority zero, name/ident, unresolved optional
and fixed repair. Playwright covers all UI states, rejects unexpected requests, measures domain work
with browser `performance.now()` and runs the feature 011 dual-engine/viewport/axe matrix.

The stress fixture is generated from package identities for a 39-slot hull and fills each slot using
package candidate APIs; import/export must each finish under 500 ms.

**Rationale**: Generated fixtures avoid private game data and browser observation proves client-only
behavior. Current probes found 48 hulls and a maximum 39 slots.

**Alternatives considered**: Hand-maintained values, Playwright transport timing, Chromium-only and
axe-only accessibility claims were rejected.

## Dependencies and blockers

- Feature 001 supplies active build, replacement, persistence and canonical link state.
- Feature 011 supplies localization, shared UI and complete Playwright/axe matrix.
- Feature 002 consumes the same normalized ingress and resets history; it must not add a second loop.
- [Almanac #292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292) and
  [Almanac #298](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/298) are implementation
  blockers. [Almanac #293](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/293) tracks
  the related missing-cargo-hatch validation gap.

No product clarification remains. These are explicit upstream release gates, not permission for an
application workaround.
