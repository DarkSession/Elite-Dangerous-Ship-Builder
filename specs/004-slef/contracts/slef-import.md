# SLEF Import Contract

Import accepts one exact string and opaque request token with or without an active build. Components
do not parse, trim, measure, normalize or commit.

## Pipeline

1. Return `empty` for whitespace-only text.
2. Measure original UTF-8 bytes. Above 65,536 returns `tooLarge` before package invocation.
3. Call package `inspectSlef(originalText)`.
4. Convert package `SyntaxError` to localized syntax framing without parsing its message.
5. Count valid entries plus rejected-entry diagnostics. Anything other than one returns cardinality
   failure with all diagnostics.
6. A sole rejected entry returns its exact diagnostics.
7. Record missing/unresolved fixed identities from inspected `entry.data`, then construct a detached
   `ShipLoadout` via `fromLoadout()`. Reject an unknown hull. Compare the source cargo identity with
   the package-restored result so automatic cargo-hatch repair remains reportable.
8. For remaining missing/unresolved fixed mounts, call `repairFixedMount()` and preserve its
   structured result and package-owned source-purchase invalidation.
9. Invoke the released Almanac quality normalizer; supported partial rolls become recomputed completed
   grades, structured refusal rejects import.
10. Read final validation and create candidate/report.
11. Give candidate/token to feature 001 replacement coordinator and use its unsaved-work rule.
12. Commit/autosave/report once on acceptance; write nothing on failure/cancel/supersession.

## Cardinality and diagnostics

- `[]` is zero-entry refusal.
- Two or more entries are refused whole, including mixed valid/invalid input.
- One envelope, one-element array or one bare journal `Loadout` are package-supported.
- The app never chooses index zero from multiple entries.
- Every diagnostic preserves index, path, code, constraint, params and package message.

## Normalization

Only partial quality completion and exact package-default fixed fill may change modelled input.
Ordinary/pre-engineered identities, effects, enabled, priority, ship name/ident, unresolved non-fixed
modules and valid purchase provenance otherwise remain. Missing defaults stay incomplete. Reports are
forbidden from build/persistence/link/SLEF payloads.

Quality completion uses `completeEngineeringGrade()` for every engineered module; fixed, reward,
effect and unresolved cases retain the package's structured outcome.

## Atomicity

Before/after every rejected/cancelled import, active snapshot/revision, provenance/dirty baseline,
working/named bytes, fragment/history length and undo/redo tape compare equal. Accepted import is one
replacement, resets edit history, and updates autosave/link only after commit.

## Released package boundary

No implementation may alter only `Quality`, merge modifiers, decide cargo-hatch credit invalidation or
add local validation issues. Tasks use the 0.1.1 APIs verified in [research.md](../research.md).
