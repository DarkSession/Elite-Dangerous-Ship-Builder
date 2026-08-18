# Viewing Conditions Contract

## Defaults and validation

A fresh workspace uses:

```text
load: unladen
pips: SYS 2, ENG 2, WEP 2
hardpoints: deployed
```

Each capacitor accepts `0..4` in half-pip steps. A settled allocation always totals six. The domain
model stores integer half-pips and the package adapter divides by two.

Controls maintain a draft independently. Apply succeeds only when all three values are in range, are
half steps and total six. Invalid Apply:

- leaves the settled conditions and results unchanged;
- exposes localized field/total guidance;
- does not increment `conditionsRevision` or announce result-count changes.

No automatic redistribution is permitted because the specification does not choose which capacitor
loses or gains a pip.

## Package mappings

| Condition    | Package use                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Hardpoints   | Select `powerBudget().deployed` or `.retracted`; retracted does not receive derived deployed-only fields |
| SYS pips     | Pass selected value to feature 006 shield/recovery/distributor package calls                             |
| ENG pips     | Pass selected value to feature 008 mobility/distributor calls                                            |
| WEP pips     | Pass selected value to feature 007 capacitor calls; it does not alter `weaponMetrics()` DPS              |
| Unladen      | Jump `.unladen`; mobility with completed `standardLoadResult('unladen')`                                 |
| Laden        | Jump `.laden`; mobility with completed `standardLoadResult('laden')`                                     |
| Maximum jump | Jump `.max`; mobility with completed `standardLoadResult('maximum')`                                     |

Package diagnostic mass, main-fuel and cargo results must complete before dependent jump/mobility
composition. Preserve their issues and do not substitute a value. A complete zero fuel capacity is
passed as zero.

[Almanac #295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295) is released in 0.1.1
as `standardLoadResult()`. No local `min`, fuel or capacity formula is allowed.

## Result scope

- The selected hardpoint state controls hardpoint-sensitive presentation. Package methods without a
  hardpoint argument do not receive a fabricated alternate numeric value.
- Under retracted hardpoints, sustained DPS exposes the observable retracted condition rather than a
  locally invented zero. Deployed uses the package result.
- Shield strength names the selected SYS condition but remains the raw package strength; feature 003
  does not apply pip resistance or power availability to it.
- Unladen mass remains unladen mass for every load selection and labels that fixed meaning.

## Lifecycle and exclusion

Accepted conditions live only in `ViewingConditionsStore` for the current active build session.
They reset to defaults on:

- browser reload/new top-level document;
- active build replacement by catalogue creation, stored record, link or SLEF import;
- transition from an active build to no build and back.

They do not reset for ordinary module edits, undo/redo or saving the same active build.

`ViewingConditions` is prohibited from:

- `BuildSnapshotV1` and `LocalRecordV1`;
- edit history and undo/redo checkpoints;
- user preferences;
- URL route/query/fragment and compact build links;
- SLEF import/export;
- local record note, provenance or validation metadata.

Serialization types use explicit allowlists so this exclusion is structural, not a cleanup pass.

## Accessibility and responsiveness

Controls expose visible localized labels, current values, the six-pip total, constraints and Apply
outcome. Touch targets are at least 44 CSS px. At narrow width/400% zoom the controls stack before the
results; expanded text and RTL content wrap without document overflow. Reduced motion changes no
settling or publication timing.

## Verification

Tests enumerate valid boundary allocations, invalid range/step/total drafts, exact fractional package
arguments, all three load mappings, reset triggers and every exclusion boundary. Reload, named-open,
link and SLEF journeys prove conditions never travel with a build.
