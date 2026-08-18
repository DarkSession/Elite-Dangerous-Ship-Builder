# SLEF Export Contract

Export consumes one atomic feature 001 snapshot of the current active `ShipLoadout`, revision and
optional canonical link certified for that revision. No active build means no generation and no stale
artifact.

## Package invocation

Generate exactly once per artifact through:

```text
loadout.toSlefString({
  header: {
    appName: <stable application identifier>,
    appVersion: <root package.json release version>,
    appURL: <same-origin canonical link certified for this active revision, when available>
  },
  credits: 'source',
  moduleOrder: 'fitted',
  explicitPower: false,
  indent: 2
})
```

Omit `appURL` when feature 001 reports absent, pending, refused, stale, noncanonical or different
revision link state. Feature 004 neither invokes the codec nor constructs deployment/base URLs.
Application name/version are build-time configuration; no runtime configuration request or copied
mock version is allowed.

## Payload boundary

Package output is exactly one SLEF entry. Preserve/package-normalize the modelled fields it owns:

- hull, fitted/unresolved slots and module identity/order;
- ordinary and package-identified pre-engineering, completed grade and optional effect;
- explicitly present enabled state and zero-based priority;
- ship name and ident;
- package-valid source purchase values.

The package owns casing, omissions and derived export values. Capture-only `timestamp`, `ShipID`, all
health state, `Hot`, ammunition, `Engineer`, `EngineerID` and `BlueprintID` do not enter the durable
result. Local record/name/note/revision, report, diagnostics, normalization provenance and substitute
values are forbidden. Fixed fill exports only the resulting package module.

The released package must own that omission. Almanac 0.1.1 retains/re-exports fitted module `Health`,
so implementation is blocked until a released package export path satisfies the accepted boundary or
the feature spec deliberately changes. The application must not parse or delete fields from package
output.

`UnladenMass`, `CargoCapacity`, `FuelCapacity` and `MaxJumpRange` are package recomputed or omitted,
not source claims echoed by the application. Unavailable remains absent; it is never zero.

## Source purchase

`credits: 'source'` is mandatory:

- an untouched valid capture re-exports the package-retained values;
- engineering quality completion retains applicable source credits because module identity is
  unchanged;
- symbol replacement/removal and fixed repair narrow values/totals according to package rules;
- an assembled build or absent source figure emits no credit field;
- retail is never fallback.

No app code removes, preserves, recalculates or compares purchase amounts to decide validity.

## Artifact lifecycle

One immutable `SlefExportArtifact` is keyed to the active revision and consumed by every SLEF
delivery action. It includes the exact payload/UTF-8 byte count, safe fixed filename, MIME type,
metadata and package validation snapshot.

- Modelled edit/replacement invalidates the artifact synchronously.
- Delivery rechecks revision equality and refuses a stale artifact.
- Failure/cancellation does not regenerate, close or clear it.
- Invalid/incomplete validation adds visible package warnings but never disables generation or
  delivery.
- Link omission is disclosed without becoming an export failure.

The labelled readonly field is selectable and owns technical wrapping/overflow.

## Round-trip contract

Tests inspect the generated string and require one entry with zero inspector diagnostics. Reconstruct
through the package, export again and compare package-modelled fields under only the two
constitutional normalizations plus documented package output normalization:

- completed engineering quality and fixed stock fill may differ from the original input;
- identity casing/header/whitespace may be normalized;
- derived top-level figures may be recomputed or omitted;
- capture-only fields are outside durable state.

Static producer/consumer fixtures supplement this test but do not prove independent acceptance of new
exports. Release validation generates a hashed reference-export corpus and records every artifact's
successful import in both Coriolis and EDSY, including each consumer's exact release/build identifier,
date and result. Prefer locally pinned consumer releases when distributable; otherwise use the
documented deliberate manual protocol with synthetic/non-personal fixtures. The application and
automated suite never contact another origin.
