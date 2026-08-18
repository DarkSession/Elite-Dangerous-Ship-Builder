# SLEF Import Contract

Import accepts one exact string and opaque request token with or without an active build. Components
do not parse, trim, measure, normalize, construct or commit.

## Pipeline

1. Measure the original string's UTF-8 bytes with `TextEncoder`. Above 65,536 returns `tooLarge`
   before whitespace/package work and names actual/limit bytes.
2. If the within-limit string is whitespace-only, return `empty`; do not transform it.
3. Call package `inspectSlef(originalText)` through the `ships/slef` leaf.
4. Convert a package `SyntaxError` to localized app-owned syntax framing without parsing/displaying
   its prose.
5. Set observed cardinality to valid entries plus diagnostics. Anything other than one returns
   cardinality failure and retains every diagnostic.
6. A sole rejected entry returns its exact diagnostic. A sole valid entry continues.
7. From the package-validated `entry.data`, capture source partial-quality records and package-fixed
   slot identity state. Resolve the hull and each partial module through package lookups. Unknown hull
   or unresolved partial refuses before construction; neither invents a `SlefDiagnostic`.
8. Construct a detached `ShipLoadout` with `fromLoadout(entry.data)`.
9. Correlate every source partial to the constructed slot and exact module identity. Call
   `completeEngineeringGrade(slot)` only for those partials. Every must return `normalized`;
   `unsupported`, missing/mismatched correlation or unexpected `unchanged` refuses the entire import.
10. Only after all source partials succeed, process fixed mounts that source evidence marked missing
    or package-unresolved and whose package reason is `requiredSlot` or `cargoHatch`. Detect package
    construction's cargo restoration by exact before/after comparison; otherwise call
    `repairFixedMount()`. Retain repaired/auto-restored outcomes. `defaultUnavailable` retains an
    incomplete candidate. `refused` or unexpected no-op is a package-contract failure.
11. Read final package validation and unresolved issues, then create the detached candidate/outcome
    data. Read no calculation before step 10 completes.
12. Give candidate/token/fixed provenance to feature 001's replacement coordinator. The SLEF feature
    performs no direct active-state, persistence, URL, provenance or history mutation.
13. On acceptance, feature 001 commits once as working provenance, navigates to `/build` when needed,
    autosaves the tab working record and synchronizes its link; feature 002 resets history. Clear the
    draft only after commit and publish the revision-bound outcome.

## Cardinality and diagnostics

- `[]` is zero-entry refusal.
- Two or more observed entries are refused whole, including mixed valid/invalid input.
- One envelope, one-element array and one bare journal `Loadout` are package-supported.
- Never choose the first valid entry from a multi-entry payload.
- Preserve every diagnostic's exact `index`, `path`, `code`, `constraint`, `params` and canonical
  `message`.
- Present diagnostic text with package `getSlefDiagnosticMessage`; disclose canonical fallback when
  the active locale is unavailable. Do not privately translate codes or parse message text.

## Normalization boundary

The shared feature 002 ingress normalizer owns ordering and outcomes for stock, record, link, reload
and SLEF ingress. Feature 004 supplies inspected source evidence; it does not implement another loop.

- Only finite source quality in `[0, 1)` requests completion. Absent or quality-1 engineering stays as
  the package modelled it and is not passed to `completeEngineeringGrade()`.
- Supported ordinary, Mercenary and identified pre-engineered/effect state becomes package-computed
  quality 1. Unsupported/unresolved partials refuse before activation.
- Only source-missing/unresolved fixed mounts receive the constitutional stock-fill exception. A
  resolved but otherwise invalid module remains package-invalid; no third normalization is invented.
- Missing package defaults remain incomplete. The application never selects/fits a substitute or
  reads or rewrites captured purchase fields.
- Unresolved non-fixed modules without partial quality remain in their original slots.

## Report and persistence split

- Quality completions, unresolved summary and final validation are revision-bound transient outcome
  presentation.
- Successful fixed fills/replacements also map to feature 001's existing local-record fixed-mount
  provenance metadata until the mount is edited.
- Feature 001 independently persists the accepted revision's `valid`/`complete` booleans in its
  working/local-record metadata; the detailed validation issue list remains transient.
- Neither path enters the modelled build snapshot, URL, SLEF payload or edit history.

## Atomicity

Before/after every failure, cancellation and supersession compare equal:

- active package loadout and revision;
- provenance, dirty baseline and current normalization metadata;
- tab working and named record bytes;
- fragment/history length and published-link state;
- undo/redo tape.

Draft text also remains exact. A successful import is one replacement; persistence/link/history
effects occur only after commit. A stale token cannot commit after close, new submit, route change or
newer replacement decision.

## Package boundary

The import semantics of the 0.1.2 leaf APIs are verified in [research.md](../research.md). Raw package
exception text, manual modifier merging, scalar quality edits, fixed default lookup, captured-price
retention and health-to-integrity inference are forbidden application behavior.
