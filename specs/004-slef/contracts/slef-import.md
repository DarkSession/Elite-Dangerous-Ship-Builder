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
7. Pass the package-validated entry through the shared package-owned construction boundary. It
   refuses an unknown hull and returns every fixed mount populated. Unknown module compatibility is
   outside the supported import contract.
8. Capture partial-quality evidence for supported package-resolved modules, then construct a detached
   `ShipLoadout` through the package boundary.
9. Correlate every retained partial to the constructed slot and exact module identity. Call
   `completeEngineeringGrade(slot)` only for those partials. Every must return `normalized`;
   `unsupported`, missing/mismatched correlation or unexpected `unchanged` refuses the entire import.
10. Read final package validation/issues, then create the detached candidate/outcome data. Read no
    calculation before construction and quality handling complete.
11. Give candidate/token to feature 001's replacement coordinator. The SLEF feature
    performs no direct active-state, persistence, URL, provenance or history mutation.
12. On acceptance, feature 001 commits once as working provenance, navigates to `/build` when needed,
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
- Unknown module identities are outside the supported import and feedback contract.
- Supported ordinary, Mercenary and identified pre-engineered/effect state on remaining resolved
  modules becomes package-computed quality 1. Unsupported partials refuse before activation.
- Every fixed mount is populated by package construction. The application never selects/fits a
  substitute, runs a repair pass, stores source provenance or reads or rewrites captured purchase
  fields.

## Report and persistence split

- Quality completions and final validation are revision-bound transient outcome presentation.
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

The leaf APIs cover SLEF inspection, engineering operations and fixed defaults verified in
[research.md](../research.md). Raw exception text,
local identity classification, manual modifier merging, scalar quality edits, fixed default lookup,
captured-price retention and health-to-integrity inference are forbidden application behavior.
