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
- current package catalogue-retail credit values.

The package owns casing, omissions and derived export values. The application does not model
capture-only `timestamp`, `ShipID`, per-module `Health`, `Hot`, ammunition, `Engineer`, `EngineerID`
or `BlueprintID`. Their presence or omission in package serialization does not affect application
acceptance or round-trip equality. Local record/name/note/revision, report, diagnostics,
normalization provenance and substitute values are forbidden. Fixed fill exports only the resulting
package module.

Module integrity is not a condition snapshot. It remains package-derived from the fitted and
engineered configuration, and round-trip tests compare the package's current integrity values/results.
The application must not parse or delete fields from package output.

`UnladenMass`, `CargoCapacity`, `FuelCapacity` and `MaxJumpRange` are package recomputed or omitted,
not source claims echoed by the application. Unavailable remains absent; it is never zero.

## Current catalogue retail

Default package credit export is mandatory:

- hull and fitted-module credits use current package catalogue list prices;
- rebuy and totals follow the package's retail calculation;
- engineering, symbol replacement/removal and fixed repair use the current resulting build;
- unpriced package entries remain absent/lower-bound exactly as the package reports;
- captured or historical purchase figures are never requested or retained.

No app code removes, preserves, recalculates or compares credit amounts to decide validity.

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
- capture-only fields are outside application-model equality;
- current package-derived module integrity remains equal after reconstruction.

Static producer/consumer fixtures supplement this test but do not prove independent acceptance of new
exports. Release validation generates a hashed reference-export corpus and records every artifact's
successful import in both Coriolis and EDSY, including each consumer's exact release/build identifier,
date and result. Prefer locally pinned consumer releases when distributable; otherwise use the
documented deliberate manual protocol with synthetic/non-personal fixtures. The application and
automated suite never contact another origin.
