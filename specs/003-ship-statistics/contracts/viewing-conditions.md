# Viewing Conditions Contract

> **Superseded 2026-08-22 (wave 11). Nothing below is built.** Three collisions between the accepted
> specification and `.design/Ship Builder.dc.html` were surfaced before implementation and **the
> design won all three** ([design/reference-review.md](../design/reference-review.md)). Ruling C
> reassigned every viewing condition to **feature 005**, which draws what its own artboard draws:
> whole pip bars, a `DEPLOYED` / `RETRACTED` toggle inside the Power capability, and no load control
> anywhere. The half-pip domain, the draft, Apply, Reset, the running total, the field guidance and
> the serialization-exclusion suite frozen here are not built and are not to be reintroduced without
> a new ruling. Feature 003 owns no condition state at all.
>
> This file is retained as the record of what was ruled against, which is why it is left as it was
> written. The conditions live in `specs/005-power-and-heat/`; what is built here is in
> [design/status-rail.md](../design/status-rail.md).

## Defaults

A new top-level document or active-build replacement settles:

```text
load: unladen
pips: SYS 2, ENG 2, WEP 2
hardpoints: deployed
```

The domain stores pips as `4/4/4` integer half-pips. This is viewing state only; it neither edits the
loadout nor creates an active build.

## Draft and Apply

The three pip controls form one draft tuple. Apply succeeds only when every value:

- parses to a finite number;
- lies from zero through four inclusive;
- is a multiple of one half;
- and the three values total exactly six.

Successful Apply converts each value to integer half-pips, settles the complete tuple and increments
`conditionsRevision` only if the tuple changed. Invalid Apply exposes localized field/total guidance,
retains the previous settled tuple/results and changes no revision or announcement counts.

Load and hardpoint controls are part of the same draft. They settle on Apply so one user decision
produces one condition revision and one atomic recomputation. Reset restores all defaults in one
settled revision.

No automatic pip redistribution is allowed because no requirement chooses which capacitor donates a
half-pip.

## Package mappings

| Condition    | Owner use                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Hardpoints   | 005 selects `powerBudget().deployed` or `.retracted`; deployed-only fields stay deployed-only       |
| SYS          | 006 passes `systemsPips` to its package defence calls                                               |
| ENG          | 008 passes `enginesPips` to selected-load mobility                                                  |
| WEP          | 005/007 pass `weaponsPips` to distributor/capacitor calls; it does not modify `weaponMetrics()` DPS |
| Maximum jump | 008 uses `standardLoadResult('maximum')` and jump summary `.max`                                    |
| Unladen      | 008 uses `standardLoadResult('unladen')` and jump summary `.unladen`                                |
| Laden        | 008 uses `standardLoadResult('laden')` and jump summary `.laden`                                    |

Only providers divide integer half-pips by two at their call boundary. Feature 003 does not compose
standard-load fuel/cargo or guard throwing jump methods; feature 008 owns those package operations.

## Meaning and scope

- Selected hardpoints affect only returned fields with package state-specific semantics.
- `weaponMetrics()` DPS remains the package firing result under either selected power state and is
  labeled with that native meaning.
- Unladen mass remains unladen mass under every load selection.
- A condition appears on a card only when it affects the package call or is necessary to distinguish
  the metric's fixed/native meaning.

## Reset and exclusion

Conditions reset on:

- browser reload/new top-level document;
- replacement by catalogue creation, named/working open, build link or SLEF import;
- transition to no active build and later activation.

They do not reset for module edits, engineering, enabled/priority changes, undo/redo, autosave or
explicit save of the same active build.

`ViewingConditions`, its draft and `conditionsRevision` are prohibited from:

- `BuildSnapshotV1` and `LocalRecordV1`;
- undo/redo history and preferences;
- route, query, fragment and compact-link payloads;
- SLEF import/export.

Serialization uses explicit allowlists so exclusion is structural.

## Accessible presentation

Controls expose visible localized group/field labels, current draft values, six-pip total, errors and
Apply/Reset outcome. They use feature 011 semantic controls with at least 44 CSS-pixel targets. At
narrow widths and 400% zoom the group stacks before results; expanded/RTL text wraps. Reduced motion
changes no settlement timing or state.

## Verification

Tests enumerate every boundary, fractional mapping, invalid parse/range/step/total case, unchanged
Apply, all three standard loads, hardpoint choices, reset triggers and serialization exclusion.
Playwright verifies pointer/touch operation and localized error semantics at all five layouts.
